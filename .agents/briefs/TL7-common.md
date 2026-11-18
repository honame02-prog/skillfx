## Vòng 2 (TL7) — sửa theo chấm so sánh
- Tiếp tục từ trạng thái file hiện tại (commit 3e61768, đã gộp TL6a–d). Đọc .agents/briefs/TL6-common.md (luật pixel, phong cách, cách đo) — vẫn áp dụng.
- LUẬT MỚI QUAN TRỌNG NHẤT: bản chi tiết phải GIÀU HƠN nháp v4 đã duyệt ở mọi khối; KHÔNG được bỏ, thu nhỏ, làm phẳng hay giảm lớp/màu bất kỳ chi tiết nào của v4. Người dùng vừa chê một bản chi tiết khác là "thô sơ" vì lý do này.
- Bản v4 để đối chiếu code: `git show bce32db:src/fx/di-hoa/<file>`; ảnh v4 ở cùng mốc: `records/gate/compare/v4.png` (trong cây chính D:/SkillFX_TuThienChi_HoaLien/skillfx; lưới 4x4, ô 1120x834; mốc 0.65,1.1,1.7,2.3 / 2.9,3.2,3.42,3.8 / 4.3,4.9,5.5,5.85 / 6.3,7.0,7.6). Chuẩn chất lượng: `records/gate/compare/thanh-lien.png` (mềm, nhiều tông, cuộn xoáy).
- Kiểm: chạy gate với `--at 0.65,1.1,1.7,2.3,2.9,3.2,3.42,3.8,4.3,4.9,5.5,5.85,6.3,7.0,7.6` (cùng mốc v4) rồi đặt strip của bạn cạnh v4.png, so TỪNG ô ở phần của bạn: không ô nào được nghèo hơn v4. Tối đa 3 vòng.
- Hiệu năng: cả chiêu hiện chỉ 1,5 / 3,3 ms (trung vị/p95), còn rất dư. Ngân sách vòng này nới gấp đôi so với brief TL6 của phần bạn; ưu tiên độ giàu.
