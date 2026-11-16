# T9a — `src/fx/ultimate/heaven-sky.js`: mây đen cuộn, trời bị giam

Đọc `.agents/briefs/T9-common.md` trước. Chỉ sửa `src/fx/ultimate/heaven-sky.js`. Vẽ ở `drawBack` (luôn sau tay).

## Cần
- **0..EMERGE**: mây mực **nhiều lớp trong mờ** (SMOKE/VAPOUR/p.disc, không bàn cờ) tràn vào từ hai mép trên, **cuộn xoắn**
  thành xoáy lớn tâm ở (0, CLOUD_BASE). Lớp xa tối & chậm, lớp gần sáng mép & nhanh. Trời tối sầm (lớp mực phủ tăng dần),
  **vignette** siết dần. **Sấm**: chớp soi sáng mặt dưới mây từ bên trong (light buffer), nhịp nhanh dần; 1–2 tia sét mảnh rẽ nhánh.
- **EMERGE..REVEALED**: lõi xoáy **mở ra** (ánh vàng từ trong), mây bị **đẩy dạt** quanh cổ tay khi tay xuống; vòng phù văn mờ
  quanh lõi; nhịp chớp nhanh dần như tim đập.
- **REVEALED..RELEASE (tù thiên)**: xoáy **đứng hình**, tia sét **đông cứng** giữa trời, màu rút gần xám (giữ vàng của phù văn),
  ~0.15 s **im lặng tuyệt đối** trước RELEASE (không chớp, không chuyển động).
- **HIT..**: một vòng sóng xung kích đánh tan mây từ tâm ra ngoài, trời sáng lại dần, mây rách tan biến; khung cuối trống.
- Không còn "vân tay" kiểu elip; nếu giữ dấu ấn thì là ánh vân xoắn rất mờ trong lõi xoáy.

Xong: `node tools/check.mjs ultimate/heaven-sky` sạch, ≤ 4 ms/khung.
