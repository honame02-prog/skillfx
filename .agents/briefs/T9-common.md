# Chung cho T9a/T9b/T9c — "Từ Thiên Chỉ" v2: kịch bản áp bách

Bản pixelfx của dự án. Đọc `docs/AUTHORING.md` ("The bar", "The method") nếu chưa. Lệnh: `node tools/render.mjs <id>`
(`records/<id>/contact.png`), `node tools/check.mjs <id>`. Dùng toolkit có sẵn, không viết lại engine.

## Kịch bản (người dùng chốt) — timeline ở `src/fx/ultimate/_lib.js` (CHỈ ĐỌC, Opus giữ)
1. `0 .. EMERGE(1.8)`: **mây đen cuộn lại** thành xoáy, trời tối sầm, sấm loé.
2. `EMERGE .. REVEALED(3.6)`: **một chỉ từ từ hiện ra** từ lõi xoáy, xuống dần tới khi lộ **toàn bộ** bàn tay (đầu ngón ở
   `HOVER_TIP` = -150, mây ở `CLOUD_BASE` ≈ -300).
3. `REVEALED .. RELEASE(4.1)`: **Tù thiên** — trời bị giam: mọi thứ khoá cứng.
4. `RELEASE .. HIT(4.28)`: **giáng xuống thật mạnh** (0.18 s từ -150 xuống 0).
5. `HIT .. DURATION(7.6)`: **Giam địa** + huỷ diệt mặt đất, dư chấn, tan, khung cuối trống.
Canvas `SIZE` 520x420, `ORIGIN` = điểm chạm (mặt đất y=0). Nhân vật thi triển đứng cách 250px bên trái (move lo phần đó).

## Mục tiêu thẩm mỹ: ÁP BÁCH tối đa, vẫn đạt "The bar"
Công cụ tạo áp lực (mỗi phần dùng cái thuộc phần mình):
- **Bóng tối lấn vào**: trời mực, vignette siết dần từ mép vào tâm tới lúc giáng.
- **Tỉ lệ**: bàn tay khổng lồ so với người tí hon; **bóng của tay** trên mặt đất lớn và tối dần khi tay xuống.
- **Áp suất**: sỏi đá/bụi bị nhấc lên rồi **bị ép bẹp xuống**; vòng áp lực (vòng phù văn) **rơi từ tay xuống đất** như quả tạ;
  sóng méo không khí; đất **lún** trước cú chạm.
- **Nhịp tim**: chớp sấm/phù văn đập theo nhịp **nhanh dần** từ EMERGE tới RELEASE, rồi **im lặng tuyệt đối** 1 nhịp ngay
  trước RELEASE (tù thiên), rồi bùng nổ.
- **Tương phản tĩnh–động**: tù thiên = đứng hình, mất màu, tia sét đông cứng giữa trời; giáng = smear + impact frame đảo màu.
Màu: đen mực + vàng kim (`GOLD`), đá `STONE`. Lõi trắng nhỏ, ánh sáng gánh độ sáng, không tô mảng bão hoà, khói trong mờ.

## Quy tắc phối hợp
- Mỗi việc **chỉ sửa file của mình**. Không sửa `_lib.js`, `_hand-hi.js`, `tu-thien-chi.js`, file của việc khác, core, tools.
- Không đụng `records/` của việc khác. Không xuất sheet/gif (Opus làm khi ghép).
- 2–3 vòng render → nhìn → sửa. Benchmark cạnh `holy/smite`, `impacts/ground-slam`, `explosions/nuke`.
- `check.mjs <id>` sạch; **≤ 4 ms/khung** (cảnh báo slow là lỗi).
- Ghi ≤ 150 từ vào `records/ultimate/REPORT-<id>.md`: đã làm gì, mốc thời gian, chỗ còn yếu.
