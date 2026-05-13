# TLSV2 - Hệ thống Thi Trực tuyến

Kiến trúc: **Next.js (Vercel) + Supabase**

## Tính năng

- Đăng nhập / đăng ký cho giám khảo (Supabase Auth)
- Tạo và quản lý đề thi (câu hỏi trắc nghiệm, tự luận, upload file)
- Tạo ca thi, chia sẻ link cho thí sinh
- Thí sinh làm bài online (đếm ngược thời gian, tự động nộp)
- Realtime: giám khảo thấy thí sinh đang thi (Supabase Realtime)
- Chấm điểm tự động (trắc nghiệm) + chấm tay (tự luận)
- Realtime: thí sinh bị hết giờ → server chấm tự động

## Setup

### 1. Supabase Database

Chạy SQL trong Supabase Dashboard → SQL Editor → `supabase/schema.sql`

### 2. Supabase Storage

Tạo bucket `exam-uploads` (public) để lưu file thí sinh upload.

### 3. Supabase Auth Settings

Bật **Email** provider trong Supabase → Authentication → Providers.

### 4. Environment Variables

```bash
cp .env.example .env.local
# Điền Supabase URL, ANON_KEY, SERVICE_ROLE_KEY
```

### 5. Deploy lên Vercel

```bash
# Push code lên GitHub
git init
git add .
git commit -m "init"
git remote add origin <your-repo>
git push

# Import repo vào vercel.com/new
# Thêm env vars:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
# Deploy!
```

## Cấu trúc thư mục

```
src/
  app/
    dashboard/          # Trang giám khảo
      exams/             # Quản lý đề thi
      sessions/         # Quản lý ca thi
      scoring/          # Chấm điểm
    exam/[code]/         # Trang thi của thí sinh
    api/upload/          # API upload file
  components/           # React components
  lib/
    supabase/           # Supabase clients
    types.ts            # TypeScript types
supabase/schema.sql     # Database schema
```

## Quy trình sử dụng

1. Giám khảo đăng ký → Tạo đề thi → Thêm câu hỏi
2. Tạo ca thi → Copy link cho thí sinh
3. Thí sinh mở link → Nhập tên → Làm bài → Nộp
4. Giám khảo chấm điểm (tự luận) → Xem kết quả
