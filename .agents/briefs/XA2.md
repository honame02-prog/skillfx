# XA2 — Tài nguyên HOẢ XÀ cho Vẫn Lạc td (imagegen), để Opus dựng thư viện

Phân vai (người dùng chốt 21/11): Opus làm thẩm mỹ + thư viện `_serpent-td-lib.js`; bạn tạo TÀI NGUYÊN HÌNH bằng imagegen. Chuyển động sẽ do mã của Opus dựng: thân xà = các đốt sprite đặt dọc đường cong (spline) mỗi khung, nên tài nguyên phải là MẢNH RỜI, cùng tỉ lệ, cùng ánh sáng, ghép nối được.

## Mẫu thẩm mỹ đã duyệt
D:/SkillFX_TuThienChi_HoaLien/design/tienson/ref-vanlac-xc/ (gen-02-storyboard.png, gen-03-head.png, closeup.png, NOTES.md): hoả xà vô hình như thuỷ tinh nóng chảy, chỉ thấy viền sáng trắng hồng, tim lửa hồng ở cổ, đầu nêm tam giác (KHÔNG mõm dài kiểu rồng), 2 mào lửa vuốt ngược, vây lưng lửa trong suốt, đuôi tưa 2 sợi. Bảng màu: #140c12 #4a1428 #a8204a #ff4f7a #ffb3c6 #efe9ee #ffffff #b9b3c4 #d8d0e0 #f4eef4.
Bối cảnh: game top-down 3/4 chếch 30°, nhân vật 57 px; thân xà rộng ~6–9 px ở cỡ thật, đầu ~12–16 px.

## write_scope
exp/XA2/**

## done_when
1. exp/XA2/gen-*.png: ảnh sinh gốc (imagegen), nền khoá màu phẳng, phong cách pixel sắc. Sinh theo dạng BẢNG TÀI NGUYÊN (sprite sheet) để các mảnh cùng tỉ lệ/ánh sáng.
2. exp/XA2/parts/ (PNG nền trong suốt, alpha 0/255, lượng tử về bảng trên, cỡ THẬT trong game):
   - head_{side,q34,top,up}.png: đầu nhìn ngang, 3/4 từ trên, thẳng từ trên, ngóc lên (há miệng nhẹ); mỗi cái 2 khung (miệng/mào lay) → head_side_0/1.png...
   - body_seg_{0..3}.png: 4 biến thể đốt thân (vỏ thuỷ tinh rỗng giữa, viền sáng 2 px), hướng ngang, nối liền đầu-cuối; body_seg_back_{0..1}.png: đốt nhìn lưng (thấy vây).
   - fin_{0..3}.png: lưỡi vây lửa lưng 4 khung lay.
   - tail_{0..2}.png: đuôi tưa 2 sợi 3 khung.
   - heart_{0..2}.png: tim lửa ở cổ, 3 cỡ đập.
   - pivots.json: với mỗi mảnh: điểm nối (khớp trước/sau, gốc vây, tâm tim) theo pixel.
3. exp/XA2/sheet.png: tất cả mảnh 4× trên nền tối + 1 hình ghép thử (đầu+6 đốt+vây+đuôi xếp thành chữ S) để kiểm nối liền.
4. exp/XA2/NOTES.md: prompt nguyên văn, số lần sinh, tự chấm (đầu nêm không giống rồng? đốt nối liền không lộ khe? cùng chất XC?).
5. `python exp/XA2/build.py` in PASS (đủ mảnh, alpha 0/255, 0 pixel ngoài bảng, pivots đủ).

## do_not
Không sửa ngoài exp/XA2. Không vẽ hình chính bằng mã (mã chỉ cắt/tách nền/lượng tử/xếp). Không dither, không alpha mềm. Không đầu rồng/mõm dài.
