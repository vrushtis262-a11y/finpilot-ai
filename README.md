---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-github-username>/FinPilot-AI.git
cd FinPilot-AI
```

Replace `<your-github-username>` with your actual GitHub username.

---

## Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

Backend URL:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

Open another terminal.

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend URL:

```
http://localhost:5173
```

---

## API Endpoints

### Authentication

- `POST /register`
- `POST /login`

### Transactions

- `GET /transactions`
- `POST /transactions`
- `PUT /transactions/{id}`
- `DELETE /transactions/{id}`

### Analytics

- `GET /analytics/summary`
- `GET /analytics/monthly`
- `GET /analytics/category-expenses`

### Budget

- `GET /budgets/summary/{month}`
- `POST /budgets`
- `PUT /budgets/{month}`
---

## Deployment

### Backend

The backend can be deployed on platforms such as:

- Render
- Railway

After deployment, update the frontend API base URL to point to your deployed backend.

### Frontend

The frontend can be deployed on:

- Vercel
- Netlify

Configure the production API URL before deploying.

---

## Screenshots

Add screenshots after deployment.

Suggested screenshots:

- Home Page
- Login Page
- Register Page
- Dashboard
- Budget Card
- Monthly Analytics
- Expense Categories
- Transactions List

---

## Future Improvements

- CSV export
- AI-powered spending recommendations
- Savings goals
- Recurring transactions
- Email notifications
- Multi-currency support
- Dark/Light theme
- Mobile application

---

## Author

**Vrushti Shah**

GitHub: https://github.com/<vrushtis262-a11y>


---

## License

This project is licensed under the MIT License.