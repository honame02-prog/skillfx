# T9c — `src/fx/ultimate/sky-quake.js`: giam địa, đất nứt toác

Đọc `.agents/briefs/T9-common.md` trước. Chỉ sửa `src/fx/ultimate/sky-quake.js` (effect bắt đầu ở t=0 = HIT của move).
Canvas mới 520x420 (`SIZE`/`ORIGIN` trong `_lib.js` đã đổi) — sửa mọi chỗ còn giả định kích thước cũ.

## Cần (t tính từ lúc chạm)
- **0–0.07**: 2 khung impact đảo màu (đen/trắng) toàn khung, rồi khung hero vàng-trắng; `Lights` loé lớn.
- **Cột sáng** rộng 24–36px phun thẳng lên tới đỉnh khung, lõi trắng, tắt dần ~0.3 s, thu hẹp.
- **2 vòm xung kích** bán cầu, mép trước sáng, nở ra quá mép khung (lệch nhịp); **sóng bụi** ép bẹp sát đất chạy ra hai bên.
- **Giam địa**: vòng phong ấn phù văn trên mặt đất (elip phối cảnh, `band`, nửa xa/nửa gần) **siết lại** từ rộng về tâm trong
  ~0.4 s; 6–8 **đinh phù văn** sáng cắm phập xuống đất quanh vòng (mỗi cái kèm tia và bụi nhỏ), đất giữa vòng **lún** thành hố.
- **Nứt toác**: khe nứt có bề rộng (4–7px gần tâm), zigzag tự nhiên, phân nhánh 2–3 cấp, **phối cảnh** (về phía người xem dài &
  dày, phía xa ngắn & mảnh), lòng nham kim sáng, lan **tới hai mép khung trong ≤ 0.2 s**; **mảng đất lớn** (Bits CHUNK 12–30px)
  bị bẩy nghiêng dọc khe; **đá văng** lớn xoay, nảy, nằm yên; geyser đá + tia lửa phun từ khe lệch nhịp.
- **Dư chấn** (0.3 s sau): một nhịp rung thứ hai nhỏ hơn, khe toác rộng thêm, bụi bốc từ khe.
- Tàn: tường bụi trong mờ tan dần, khe nguội vàng → cam → đỏ sẫm → tắt, hố mờ dần; **khung cuối trống**.
- Hiệu năng: hiện 6.1 ms/khung → phải ≤ 4 ms (cache khe nứt vào frame phụ 1 lần, giảm hạt thừa).

Xong: `node tools/check.mjs ultimate/sky-quake` sạch, không cảnh báo slow.
