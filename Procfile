web: cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn fraud_project.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120
