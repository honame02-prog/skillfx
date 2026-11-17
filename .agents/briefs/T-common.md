## Bối cảnh chung (Tam Thiên Diễm Viêm Hoả — chi tiết, chia phần)
- Kịch bản: D:/SkillFX_TuThienChi_HoaLien/design/di-hoa/04-tam-thien-diem-viem-hoa.md (đọc phần v2 và v3 cuối file). Nháp đã duyệt: src/fx/di-hoa/tam-thien-draft.js (người dùng đã DUYỆT dáng này — chi tiết hoá, không đổi ý tưởng).
- Chiêu = khung `src/fx/di-hoa/tam-thien.js` (Opus giữ) + 4 phần `_tamthien-{sky,rain,orb,stars}.js`. File phần của bạn ĐÃ có code port y nguyên từ nháp — nâng cấp nó. MỖI VIỆC CHỈ SỬA ĐÚNG FILE PHẦN CỦA MÌNH.
- Giao diện cố định: `export function <tên>(p, t, layer)` — layer 'back' | 'front'; stateless, tất định theo t (hash theo chỉ số, không Math.random; bảng tính sẵn ở cấp module được phép vì không đổi theo t).
- Dữ liệu chung: `src/fx/di-hoa/_tamthien-common.js` (C ramp 7 màu: 0 đen tím … 6 trắng; mốc IGNITE/RAIN/ORB/STARS/FADE/CLIMAX/END; R=70, SC tâm cầu, SKY mép trên khung; hsh; orbState(t) → {form, inten, squeeze, Rr, peel, flare} để phần vỏ và phần sao khớp nhau). KHÔNG sửa file này.
- Chất liệu "lửa đen": lõi tối gần đen, mép sáng tím hồng. Sao là điểm sáng trắng tím. Đậm, opaque (alpha thấp bị vẽ thành chấm lấm tấm). Không cam/xanh. Không p.glow r > 45 hoặc k > 0.35; không chớp toàn màn.
- Painter: `p.shade(x0,y0,x1,y1,(x,y,o))` đặt o.c/o.a (tô) hoặc o.l/o.k (cộng sáng); p.line, p.dot, p.disc, p.poly, p.polyline, p.glow. Toạ độ local: gốc ở chân nhân vật, mục tiêu x=150, đất y=0, khung x −60…299, y −235…24. KHÔNG vẽ ra ngoài khung.
- Hiệu năng: cả chiêu phải `node tools/gate.mjs di-hoa/tam-thien` PASS (trung vị ≤ 5 ms, p95 ≤ 16 ms). Bản port hiện: trung vị 5.6 ms. Ngân sách phần ghi trong brief riêng. Máy có thể đang chạy việc khác nên số dao động ±30%: so trước/sau trên cùng lệnh.
- Thời gian: việc nhỏ, mục tiêu ≤ 12 phút. Xem strip 2 vòng, mỗi vòng sửa chỗ xấu nhất. Báo cáo: đã thêm gì, số perf trước/sau.
- KHÔNG: sửa file khác ngoài write_scope; tạo GIF/MP4; đổi act/nhịp/mốc thời gian.
