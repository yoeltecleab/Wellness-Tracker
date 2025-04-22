<div style="display: flex; align-items: center; justify-content: center;">
    <img alt="Wellness Tracker Logo" src="static/images/logos/Wellness%20Logo.png" width="50" style="margin-top: 35px; margin-right: 30px;" />
    <h1 style="color: #5c97ef;">Wellness Tracker</h1>
</div>

The Wellness Tracker is a web application designed to help users monitor and improve their overall well-being. Users can
track various aspects of their wellness, such as water intake, food, and nutrition, through an intuitive and
user-friendly interface.

---

## Features

- Track daily activities and wellness metrics.
- View progress through visual charts and reports.
- Set and manage personal wellness goals.
- User-friendly interface with responsive design.

---

## Project Setup

Follow these steps to set up and run the project locally:

### Prerequisites

Ensure you have the following installed on your system:

- **Git**
- **Python** (version 3.8 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yoeltecleab/wellness-tracker.git
   cd wellness_tracker
   ```

2. Set up a virtual environment and activate: (recommended, but optional)
   ```bash
   python -m venv <your-env-name>
   source <your-env-name>/bin/activate  # On Windows use: <your-env-name>\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Running the Application

1. Start the development server:
   ```bash
   python manage.py runserver
   ```

2. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000
   ```

---

## Demo Credentials

After running the required commands above, click on the _`Create Demo Account`_ button on the landing page then use the following credentials to log in as a demo user:

- **Username:** `demo`
- **Password:** `pass`

---

## Project Structure

```
wellness_tracker/
├── wellness_tracker/         # Project settings and configuration
├── core/                     # Main Django app (wellness tracking)
      ├── templates/          # HTML templates
      ├── api/                # API views and utilities
├── static/                   # Static assets (CSS, JS, images)
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
└── README.md                 # Project documentation
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
   - Click the "Fork" button on the top right of the repository page.
   - This creates a copy of the repository under your GitHub account.
   - You can now make changes to your forked repository without affecting the original project.
   - You can also clone your forked repository to your local machine using the command:
   ```bash
   git clone https://github.com/<your-username>/<repository-name>.git
    ```
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---
