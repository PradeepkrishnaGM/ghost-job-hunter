import os
import time
import random
import requests
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from dateutil import parser
from supabase import create_client, Client

# --- SECURE SUPABASE CONFIG ---
# This tells Python to look for hidden environment variables instead of hardcoded strings
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

GHOST_JOB_THRESHOLD_DAYS = 45
PRUNE_THRESHOLD_DAYS = 90

# --- LINKEDIN HELPER: Convert "3 weeks ago" to days ---
def parse_linkedin_time_ago(time_str):
    time_str = time_str.lower().strip()
    if 'minute' in time_str or 'hour' in time_str or 'just now' in time_str:
        return 0
    
    try:
        num = int(''.join(filter(str.isdigit, time_str)))
        if 'day' in time_str:
            return num
        elif 'week' in time_str:
            return num * 7
        elif 'month' in time_str:
            return num * 30
        elif 'year' in time_str:
            return num * 365
    except ValueError:
        pass
    
    return 0 # Default if parsing fails

# --- LINKEDIN SCRAPER ---
def scrape_linkedin_jobs(company="Google", location="Worldwide"):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }
    
    # We search by Company Name and Location to get global top-tier jobs
    list_url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={company.replace(' ', '%20')}&location={location.replace(' ', '%20')}&start=0"
    job_view_url = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/"

    print(f"--- LinkedIn: Fetching list for '{company}' in '{location}' ---")
    try:
        response = requests.get(list_url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching LinkedIn list: {e}")
        return []

    list_soup = BeautifulSoup(response.text, 'html.parser')
    page_jobs = list_soup.find_all('li')

    id_list = []
    for job in page_jobs:
        base_card_div = job.find('div', class_='base-card')
        if base_card_div and base_card_div.get('data-entity-urn'):
            job_id = base_card_div.get('data-entity-urn').split(':')[-1]
            id_list.append(job_id)

    job_list = []
    current_time = datetime.now(timezone.utc)

    # Limiting to 5 per company so LinkedIn doesn't block us on the free tier
    for job_id in id_list[:5]: 
        full_url = f"{job_view_url}{job_id}"
        try:
            time.sleep(random.uniform(1, 2)) 
            job_response = requests.get(full_url, headers=headers, timeout=10)
            job_soup = BeautifulSoup(job_response.text, 'html.parser')
            
            title_elem = job_soup.find('h2', class_='top-card-layout__title') or job_soup.find('h1')
            time_elem = job_soup.find('span', class_='posted-time-ago__text')
            
            job_title = title_elem.text.strip() if title_elem else "Unknown Title"
            time_str = time_elem.text.strip() if time_elem else "0 days ago"
            
            # Calculate days active and ghost status
            days_active = parse_linkedin_time_ago(time_str)
            is_ghost_job = days_active > GHOST_JOB_THRESHOLD_DAYS
            
            # Reconstruct a formatted date string for the database
            calculated_date = current_time - timedelta(days=days_active)
            
            job_data = {
                "title": job_title,
                "company": company,
                "link": f"https://www.linkedin.com/jobs/view/{job_id}",
                "published_date": calculated_date.strftime("%Y-%m-%d"),
                "days_active": days_active,
                "is_ghost_job": is_ghost_job
            }
            job_list.append(job_data)
            print(f"  [LI] Scraped: {job_title} ({time_str})")
        except Exception as e:
            print(f"  [LI] Could not scrape job {job_id}")

    return job_list

# --- RSS SCRAPER (We Work Remotely) ---
def scrape_rss_jobs():
    RSS_FEED_URL = "https://weworkremotely.com/remote-jobs.rss"
    print(f"\n--- RSS: Fetching jobs from {RSS_FEED_URL} ---")
    feed = feedparser.parse(RSS_FEED_URL)
    
    parsed_jobs = []
    current_time = datetime.now(timezone.utc)

    for entry in feed.entries:
        raw_pub_date = entry.published
        pub_date_obj = parser.parse(raw_pub_date)
        days_active = (current_time - pub_date_obj).days
        is_ghost_job = days_active > GHOST_JOB_THRESHOLD_DAYS

        raw_title = entry.title
        if ":" in raw_title:
            split_title = raw_title.split(":", 1) 
            company_name = split_title[0].strip()
            job_title = split_title[1].strip()
        else:
            company_name = entry.get('author', 'Unknown Company')
            job_title = raw_title

        job_data = {
            "title": job_title,
            "company": company_name,
            "link": entry.link,
            "published_date": pub_date_obj.strftime("%Y-%m-%d"),
            "days_active": days_active,
            "is_ghost_job": is_ghost_job
        }
        parsed_jobs.append(job_data)
        
    return parsed_jobs

# --- MAIN EXECUTION PIPELINE ---
if __name__ == "__main__":
    all_jobs = []
    
    # 1. Gather Global Tech Giants from LinkedIn
    # You can expand this list easily
    top_companies = ["Microsoft", "Google", "Stripe", "Spotify", "Meta"]
    for company in top_companies:
        li_jobs = scrape_linkedin_jobs(company=company, location="Worldwide")
        all_jobs.extend(li_jobs)
        
    # 2. Gather General Remote Tech Jobs from RSS
    rss_jobs = scrape_rss_jobs()
    all_jobs.extend(rss_jobs)
    
    print(f"\nSuccessfully gathered {len(all_jobs)} total jobs. Pushing to Supabase...\n")
    
    # 3. Push to Database
    for job in all_jobs:
        try:
            supabase.table('jobs').insert(job).execute()
            print(f"✅ Saved: {job['company']} - {job['title']}")
        except Exception as e:
            pass # Skips duplicates silently
            
    # 4. DATA PRUNING (The Professional Touch)
    print("\n🧹 Running Data Pruning...")
    try:
        # Deletes any job older than our PRUNE threshold
        response = supabase.table('jobs').delete().gt('days_active', PRUNE_THRESHOLD_DAYS).execute()
        print(f"✅ Pruning complete. Database is clean!")
    except Exception as e:
        print(f"⚠️ Pruning error: {e}")

    print("\n🚀 Pipeline finished.")
