# FinanceMate 💰

A modern expense tracking app with AI-powered savings suggestions. Built with Next.js, TypeORM, Neon Database, Clerk Authentication, and Google Gemini AI.

## Features

- 🔐 **Secure Authentication** - Powered by Clerk
- 📊 **Expense Tracking** - Add, view, and manage your expenses
- 🏷️ **Categorization** - Organize expenses by categories (Food, Transport, Entertainment, etc.)
- 📈 **Visual Analytics** - Interactive charts and spending summaries
- 🤖 **AI Suggestions** - Get personalized savings tips powered by Google Gemini
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔍 **Filtering** - Filter expenses by category, month, and year

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, TypeORM
- **Database**: Neon Postgres (Serverless)
- **Authentication**: Clerk
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon Database account
- A Clerk account
- A Google AI Studio account (for Gemini API)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd finance-mate
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (Neon Postgres)
DATABASE_URL=postgresql://username:password@hostname:port/database

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

The app uses TypeORM with automatic schema synchronization. When you first run the app, it will automatically create the necessary tables.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── expenses/          # Expense CRUD API
│   │   └── suggestions/       # AI suggestions API
│   ├── dashboard/             # Main dashboard page
│   ├── sign-in/               # Clerk sign-in page
│   └── sign-up/               # Clerk sign-up page
├── components/
│   ├── Dashboard.tsx          # Main dashboard component
│   ├── AddExpenseModal.tsx    # Add expense modal
│   ├── ExpenseList.tsx        # Expense list component
│   ├── ExpenseSummary.tsx     # Spending summary with charts
│   └── SuggestionsPanel.tsx   # AI suggestions panel
├── lib/
│   ├── database.ts            # TypeORM configuration
│   └── entities/
│       └── Expense.ts         # Expense entity
└── middleware.ts              # Clerk middleware
```

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses (with optional filters)
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/[id]` - Get a specific expense
- `PUT /api/expenses/[id]` - Update an expense
- `DELETE /api/expenses/[id]` - Delete an expense

### AI Suggestions
- `GET /api/suggestions` - Get AI-powered savings suggestions

## Usage

1. **Sign Up/In**: Create an account or sign in with Clerk
2. **Add Expenses**: Click "Add Expense" to track your spending
3. **View Analytics**: See your spending patterns in the summary panel
4. **Get Suggestions**: Check the AI suggestions panel for personalized tips
5. **Filter Data**: Use the filters to view expenses by category, month, or year

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
