# 🏨 Bookflow - Nền Tảng Đặt Phòng Khách Sạn & Du Lịch

[![CI/CD Pipeline](https://github.com/yourusername/bookflow/actions/workflows/cicd.yml/badge.svg)](https://github.com/yourusername/bookflow/actions/workflows/cicd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

Bookflow là một dự án đa nền tảng toàn diện, cung cấp giải pháp đặt phòng khách sạn và khám phá du lịch, phục vụ cho ba đối tượng người dùng chính: **Khách hàng**, **Chủ khách sạn**, và **Quản trị viên**.

## 📋 Mục lục
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Kiến trúc dự án](#-kiến-trúc-dự-án)
- [Demo & Screenshots](#-demo--screenshots)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [API Documentation](#-api-documentation)
- [CI/CD & Deployment](#-cicd--deployment)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

## ✨ Tính năng nổi bật

### 👤 Dành cho Khách hàng
- 🔍 Tìm kiếm và lọc khách sạn theo vị trí, giá, đánh giá
- 📅 Đặt phòng trực tuyến với lịch thời gian thực
- 💳 Thanh toán an toàn qua nhiều phương thức
- ⭐ Đánh giá và nhận xét khách sạn
- 📱 Giao diện responsive trên mọi thiết bị

### 🏨 Dành cho Chủ khách sạn
- 🏢 Quản lý thông tin khách sạn và phòng
- 📊 Thống kê doanh thu và đặt phòng
- 📋 Quản lý đơn đặt phòng
- 🖼️ Upload và quản lý hình ảnh
- 📈 Báo cáo chi tiết

### 👨‍💼 Dành cho Quản trị viên
- 👥 Quản lý người dùng hệ thống
- 🏨 Phê duyệt và quản lý khách sạn
- 📊 Dashboard tổng quan hệ thống
- 🔒 Quản lý phân quyền
- 🛠️ Cấu hình hệ thống

## 🏗️ Kiến trúc dự án

### Tech Stack
- **Frontend:** ReactJS 18, TailwindCSS, React Router
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** PostgreSQL (Supabase)
- **File Storage:** Supabase Storage
- **Payment:** Stripe API
- **Email:** SendGrid
- **CI/CD:** GitHub Actions
- **Container:** Docker & Docker Compose

### Kiến trúc hệ thống
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│  (React)    │◄──►│ (Node.js)   │◄──►│(PostgreSQL) │
│   Port 3000 │    │  Port 8080  │    │  Port 5432  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🖼️ Demo & Screenshots

### 🌐 Demo trực tuyến
- **Frontend:** [https://bookflow-demo.vercel.app](https://bookflow-demo.vercel.app)
- **API Docs:** [https://api.bookflow.com/docs](https://api.bookflow.com/docs)

### 📱 Screenshots
| Trang chủ | Tìm kiếm | Đặt phòng |
|-----------|----------|-----------|
| ![Home](./docs/images/home.png) | ![Search](./docs/images/search.png) | ![Booking](./docs/images/booking.png) |

## 🚀 Cài đặt & Chạy dự án

### 📋 Yêu cầu hệ thống
- **Node.js:** >= 18.0.0
- **Docker:** >= 20.10.0
- **Docker Compose:** >= 2.0.0
- **Git:** Latest version

### ⚡ Cài đặt nhanh với Docker

1. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/bookflow.git
   cd bookflow
   ```

2. **Cấu hình environment:**
   ```bash
   # Copy và chỉnh sửa file .env
   cp server/.env.example server/.env
   # Cập nhật các biến môi trường cần thiết
   ```

3. **Khởi động với Docker:**
   ```bash
   docker-compose up --build
   ```

4. **Truy cập ứng dụng:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### 🔧 Cài đặt thủ công

#### Backend Setup
```bash
cd server
npm install
npm run dev
```

#### Frontend Setup
```bash
cd web_app
npm install
npm start
```

### 🔑 Cấu hình Environment Variables

#### Server (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bookflow

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
```

## 📚 API Documentation

### 🔗 Endpoint chính
- **Authentication:** `/api/v1/auth`
- **Hotels:** `/api/v1/hotels`
- **Bookings:** `/api/v1/bookings`
- **Users:** `/api/v1/users`
- **Payments:** `/api/v1/payments`

### 📖 Swagger Documentation
Truy cập: `http://localhost:8080/api-docs` để xem API documentation đầy đủ.

## 🔄 CI/CD & Deployment

### GitHub Actions
- **Build & Test:** Tự động chạy khi push/PR
- **Deploy:** Tự động deploy khi merge vào `main`
- **Docker:** Build và push images

### Deployment Options
1. **Docker Compose** (Recommended)
2. **Vercel** (Frontend)
3. **Railway/Heroku** (Backend)
4. **VPS/Cloud Server**

### Docker Compose (Backend + Frontend + AI Model + MongoDB)

The stack is wired via `docker-compose.yml`:

- backend (Node.js) listens on port 8080
- frontend (React) is served on port 3000
- ai-model (Flask + Transformers) on port 5000
- mongo (MongoDB) on port 27017

Quick start:

```powershell
# Windows PowerShell
docker-compose build; docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f ai-model
```

Verify:

- API Docs: http://localhost:8080/api-docs
- AI endpoint (via backend): backend posts to the AI at `AI_MODEL_API_URL`
- AI direct test: `POST http://localhost:5000/check-comment` with `{ "text": "sample" }`

Environment:

- `server/.env` is mounted; in containers we override `MONGO_URI` to talk to the `mongo` service
- `AI_MODEL_API_URL` defaults to `http://ai-model:5000/check-comment` inside Docker

### Environment Branches
- `main` - Production
- `develop` - Development
- `mobile` - Mobile-specific features
- `web` - Web-specific features

## 📁 Cấu trúc thư mục

```
bookflow/
├── 📁 server/                 # Backend API
│   ├── 📁 src/
│   │   ├── 📁 api/v1/        # API routes
│   │   ├── 📁 config/        # Configuration
│   │   ├── 📁 middleware/    # Express middlewares
│   │   ├── 📁 services/      # Business logic
│   │   └── 📁 utils/         # Utilities
│   ├── 📄 package.json
│   ├── 📄 Dockerfile
│   └── 📄 .env.example
├── 📁 web_app/               # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/    # React components
│   │   ├── 📁 pages/         # Page components
│   │   ├── 📁 hooks/         # Custom hooks
│   │   ├── 📁 context/       # React context
│   │   ├── 📁 services/      # API services
│   │   └── 📁 utils/         # Utilities
│   ├── 📄 package.json
│   ├── 📄 Dockerfile
│   └── 📄 tailwind.config.js
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 cicd.yml       # GitHub Actions
├── 📁 docs/                  # Documentation
├── 📄 docker-compose.yml     # Docker setup
├── 📄 README.md
└── 📄 LICENSE
```

## 🤝 Đóng góp

### Cách đóng góp
1. **Fork** repository
2. **Tạo branch** cho feature mới:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** thay đổi:
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **Push** lên branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Tạo Pull Request**

### Coding Standards
- **ESLint** cho code quality
- **Prettier** cho code formatting
- **Conventional Commits** cho commit messages

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📞 Liên hệ & Hỗ trợ

- **Email:** htuan15424@gmail.com




---

<div align="center">

**⭐ Nếu dự án hữu ích, hãy cho chúng tôi một Star trên GitHub! ⭐**

Made with ❤️ by [Hoàng Tuấn](https://github.com/htuan154)

</div>



