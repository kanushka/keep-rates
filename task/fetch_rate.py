import requests
import logging
from datetime import datetime
import os

# configure logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    filename='logs/rates.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def fetch_usd_rate():
    url = "https://fetchandsaveusdrate-gmml7hkpoq-uc.a.run.app/"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        logging.info(f"USD Rate Data: {data}")
        return data
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching USD rate: {str(e)}")
        return None

if __name__ == '__main__':
    fetch_usd_rate()
