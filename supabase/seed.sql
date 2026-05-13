-- ================================================
-- TLSV2 - Seed Data
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- Get admin user
DO $$
DECLARE
  admin_id uuid;
  it_exam_id uuid;
  monitor_exam_id uuid;
  q1 uuid; q2 uuid; q3 uuid; q4 uuid; q5 uuid;
BEGIN
  -- Find or create admin profile
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@tlsv2.local' LIMIT 1;
  
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin profile not found. Please ensure the admin user exists in auth.users';
  END IF;

  -- ================================================
  -- Create IT Exam
  -- ================================================
  INSERT INTO public.exams (code, name, description, duration_minutes, total_score, status, created_by)
  VALUES (
    'IT',
    'Phần thi IT',
    'Phần thi kiến thức CNTT',
    90,
    100,
    'active',
    admin_id
  )
  RETURNING id INTO it_exam_id;

  -- IT Questions
  INSERT INTO public.questions (exam_id, order_index, type, content, score)
  VALUES
    (it_exam_id, 1, 'single_choice', 'Mã nguồn mở là gì?', 10),
    (it_exam_id, 2, 'single_choice', 'Docker dùng để làm gì?', 10),
    (it_exam_id, 3, 'single_choice', 'Git là gì?', 10),
    (it_exam_id, 4, 'single_choice', 'HTTP/2 so với HTTP/1.1 có ưu điểm gì?', 10),
    (it_exam_id, 5, 'single_choice', 'RESTful API là gì?', 10),
    (it_exam_id, 6, 'single_choice', 'Database indexing là gì?', 10),
    (it_exam_id, 7, 'single_choice', 'CI/CD nghĩa là gì?', 10),
    (it_exam_id, 8, 'single_choice', 'Cloud computing là gì?', 10),
    (it_exam_id, 9, 'single_choice', 'API endpoint là gì?', 10),
    (it_exam_id, 10, 'single_choice', 'SSH được sử dụng để làm gì?', 10)
  RETURNING id INTO q1;

  -- IT Answer Options for Q1
  INSERT INTO public.answer_options (question_id, option_key, content, is_correct, order_index)
  VALUES
    (q1, 'A', 'Phần mềm có mã nguồn công khai, ai cũng có thể xem và đóng góp', true, 1),
    (q1, 'B', 'Phần mềm miễn phí', false, 2),
    (q1, 'C', 'Phần mềm không cần cài đặt', false, 3),
    (q1, 'D', 'Phần mềm chỉ chạy trên Linux', false, 4);

  -- IT Answer Options for Q2 (Docker)
  INSERT INTO public.questions (exam_id, order_index, type, content, score)
  VALUES (it_exam_id, 2, 'single_choice', 'Docker dùng để làm gì?', 10)
  RETURNING id INTO q2;

  INSERT INTO public.answer_options (question_id, option_key, content, is_correct, order_index)
  VALUES
    (q2, 'A', 'Đóng gói và chạy ứng dụng trong container', true, 1),
    (q2, 'B', 'Quản lý cơ sở dữ liệu', false, 2),
    (q2, 'C', 'Mã hóa file', false, 3),
    (q2, 'D', 'Thiết kế giao diện web', false, 4);

  -- IT Answer Options for Q3 (Git)
  INSERT INTO public.questions (exam_id, order_index, type, content, score)
  VALUES (it_exam_id, 3, 'single_choice', 'Git là gì?', 10)
  RETURNING id INTO q3;

  INSERT INTO public.answer_options (question_id, option_key, content, is_correct, order_index)
  VALUES
    (q3, 'A', 'Hệ thống quản lý phiên bản phân tán', true, 1),
    (q3, 'B', 'Ngôn ngữ lập trình', false, 2),
    (q3, 'C', 'Framework web', false, 3),
    (q3, 'D', 'Trình duyệt web', false, 4);

  -- ================================================
  -- Create MONITOR (Màn hình) Exam
  -- ================================================
  INSERT INTO public.exams (code, name, description, duration_minutes, total_score, status, created_by)
  VALUES (
    'MONITOR',
    'Phần thi Màn hình',
    'Phần thi kiểm tra màn hình và hiển thị',
    60,
    100,
    'active',
    admin_id
  )
  RETURNING id INTO monitor_exam_id;

  -- MONITOR Questions
  INSERT INTO public.questions (exam_id, order_index, type, content, score)
  VALUES
    (monitor_exam_id, 1, 'single_choice', 'Tần số quét của màn hình 144Hz nghĩa là gì?', 10),
    (monitor_exam_id, 2, 'single_choice', 'Độ phân giải 4K UHD có bao nhiêu pixel?', 10),
    (monitor_exam_id, 3, 'single_choice', 'Panel IPS so với TN có ưu điểm gì?', 10),
    (monitor_exam_id, 4, 'single_choice', 'AMD FreeSync dùng để làm gì?', 10),
    (monitor_exam_id, 5, 'single_choice', 'Tỷ lệ tương phản 3000:1 nghĩa là gì?', 10),
    (monitor_exam_id, 6, 'single_choice', 'Màn hình cong (Curved) có ưu điểm gì?', 10),
    (monitor_exam_id, 7, 'single_choice', 'Độ sáng 300 nit phù hợp cho môi trường nào?', 10),
    (monitor_exam_id, 8, 'single_choice', 'Cổng kết nối DisplayPort 1.4 hỗ trợ độ phân giải tối đa nào?', 10),
    (monitor_exam_id, 9, 'single_choice', 'Thời gian phản hồi 1ms (GtG) nghĩa là gì?', 10),
    (monitor_exam_id, 10, 'single_choice', 'HDR400 so với HDR1000 khác nhau ở điểm nào?', 10);

  -- ================================================
  -- Create sample sessions for testing
  -- ================================================
  INSERT INTO public.sessions (exam_id, code, candidate_name, status, ended_at)
  VALUES
    (it_exam_id, 'IT-2026-001', 'Nguyễn Văn A', 'completed', now()),
    (it_exam_id, 'IT-2026-002', 'Trần Thị B', 'completed', now()),
    (monitor_exam_id, 'MN-2026-001', 'Lê Văn C', 'completed', now()),
    (monitor_exam_id, 'MN-2026-002', 'Phạm Thị D', 'completed', now());

  RAISE NOTICE 'Seed data created successfully!';
END $$;
