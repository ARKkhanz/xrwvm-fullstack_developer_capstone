FROM python:3.11-slim-bookworm

WORKDIR /python-docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Locate the bundled NLTK sentiment dictionary.
ENV NLTK_DATA=/python-docker
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

EXPOSE 5000
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
