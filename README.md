
# STEDIN Dashboard

The STEDIN Dashboard is a comprehensive PoC, which is a web application designed to monitor and manage edge devices effectively.

## Features

- **User Authentication**: Secure login system with role-based access control.
- **Interactive Dashboards**: Customizable dashboards with an overview of data you need.
- **Control**: Customize settings and status of edge devices and their applications.


## Technologies Used

- **Frontend**: Next.js (React framework) for a responsive and dynamic user interface.
- **Backend**: Go (Golang) for a robust and efficient server-side application.
- **Database**: PostgreSQL for reliable data storage and management.
- **Styling**: shadcn/ui (using Tailwind CSS) for modern and maintainable design.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/JustDave2002/STEDIN-dashboard.git
   cd STEDIN-dashboard
   ```

2. **Backend Setup**:
   - Navigate to the `go-backend` directory:
     ```bash
     cd go-backend
     ```
   - Install dependencies:
     ```bash
     go mod download
     ```
   - Set up environment variables as specified in the `.env.example` file.
   - Run the backend server:
     ```bash
     go run main.go
     ```

3. **Frontend Setup**:
   - Navigate to the `next-frontend` directory:
     ```bash
     cd ../next-frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Set up environment variables as specified in the `.env.example` file.
   - Run the frontend development server:
     ```bash
     npm run dev
     ```

4. **Database Setup**:
   - Ensure PostgreSQL is installed and running.
   - Create a new database for the application.
   - Apply database migrations located in the `DB_seeding` directory.

## Usage

- Access the frontend application at `http://localhost:3000`.
- Use the provided credentials to log in and explore the dashboard features.


## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

Special thanks to Stedin for making this possible.

---

For any questions or support, please open an issue in this repository.

