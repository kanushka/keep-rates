import requests
import logging
import os
from datetime import datetime
import pytz

# configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def fetch_usd_rate():
    url = "https://fetchandsaveusdrate-gmml7hkpoq-uc.a.run.app/"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        logging.info(f"Rate data: {data}")
        return data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching rate: {str(e)}")
        return None

def should_send_email():
    # Get the current time in Colombo
    colombo_tz = pytz.timezone('Asia/Colombo')
    current_time = datetime.now(colombo_tz)
    current_hour = current_time.hour
    logging.info(f"Current time in Colombo: {current_time}")
    # Get time range from environment variables, default to 9-10
    start_hour = int(os.getenv('EMAIL_START_HOUR', '9'))
    end_hour = int(os.getenv('EMAIL_END_HOUR', '10'))
    
    return start_hour <= current_hour < end_hour

def trigger_email():
    url = "https://sendratesemailmanually-gmml7hkpoq-uc.a.run.app/"
    try:
        response = requests.post(url)
        response.raise_for_status()
        logging.info("Email triggered successfully")
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Error triggering email: {str(e)}")
        return False

if __name__ == '__main__':
    rate_data = fetch_usd_rate()
    if rate_data and should_send_email():
        logging.info("Time is within email sending window, triggering email")
        trigger_email()
