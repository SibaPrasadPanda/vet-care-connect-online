# Vet Care Connect Online

A modern veterinary practice management web application built with React, TypeScript, Vite, Supabase, and shadcn/ui.

## Features
- User authentication (Supabase Auth)
- User profile management
- Pet management (add, edit, view pets)
- Appointment scheduling and management
- Consultations and veterinarian responses
- Prescription management
- Role-based dashboards (patient, doctor, agent, admin)
- Responsive, modern UI with shadcn/ui and Tailwind CSS

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **UI:** shadcn/ui, Radix UI, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL)
- **State Management:** React Query

## Project Structure
```
├── src/
│   ├── components/         # Reusable UI and layout components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase and other integrations
│   ├── pages/              # Main application pages/routes
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── supabase/               # Database migrations and config
├── package.json            # Project metadata and scripts
└── README.md               # Project documentation
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase project credentials.
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Apply database migrations:**
   - Use the Supabase CLI or run the SQL files in `supabase/migrations/` via the Supabase SQL Editor.

## Deployment
- Build for production:
  ```bash
  npm run build
  ```
- Preview production build:
  ```bash
  npm run preview
  ```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
