goal: Lắp `_tinhlien-eye-lib.js` vào `src/fx/di-hoa/_tinhlien-sky.js`.
1. Lửa mí: thay toàn bộ phần vẽ lửa mí hiện có (hàm flames/TONGUES và dải nối) bằng lidFlames: mí trên dir -1, H(x) cao ~26–30 px ở giữa mí, thấp dần về 2 khoé, khoé ngoài nhỉnh hơn (như thẻ: 28·(1−u²)^0.6·(1+0.35u)); mí dưới dir +1, H ×0.32; lidY = đường mí hiện có (TOP/BOTTOM theo cột), cx = tâm con ngươi, k theo eyeK·độ mở, heat tăng khi lockAt. Giữ tàn lửa xoáy về con ngươi nếu có.
2. Mắt sập (SHUT 5.72–5.9 trở đi): khi hai mí gặp nhau thì vẽ shutBand tại tâm mắt (hw = nửa bề rộng mắt), k = 1 lúc sập rồi giảm về 0 trong ~0.5 s; bỏ nét trắng mảnh hiện tại.
3. Màn tối: thay darkness bằng veil với level(x,y) = (mức tối theo openAt/LEVEL) × độ xa vùng nhân vật–mục tiêu, cộng nhiễu chậm (vài sin thấp tần như thẻ) để đường đồng mức không thành vòng; DARK = bảng tối hiện có (nhạt→sẫm). Giữ vùng nhân vật–mục tiêu–đất sáng hơn.
Giữ nguyên: dáng mí, tròng, con ngươi, vết rách, mây.
write_scope: src/fx/di-hoa/_tinhlien-sky.js
done_when: gate PASS; sky() trung vị ≤ 3 ms, p95 ≤ 6 ms; strip ô 1.7–5.5 lửa mí dày như thẻ, ô 5.85 là dải lửa, màn tối không vân vòng.
Đọc: .agents/briefs/TL9-common.md
