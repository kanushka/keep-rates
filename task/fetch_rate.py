import requests
import logging

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

if __name__ == '__main__':
    fetch_usd_rate()
