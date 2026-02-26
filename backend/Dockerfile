FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/start.sh

RUN sed -i 's/\r$//' /app/start.sh

EXPOSE 8000

ENV PYTHONPATH=/app

CMD ["./start.sh"]