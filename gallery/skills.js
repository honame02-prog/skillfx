// Danh sách 7 skill đã chốt, dùng chung cho showcase và battle.
export const GROUPS = [
  ["Bộ Dị Hoả", [
    ["di-hoa/thanh-lien", "Thanh Liên Địa Tâm Hoả", "Dị Hoả 1 · lục lam, đánh vùng mặt đất"],
    ["di-hoa/cot-linh", "Cốt Linh Lãnh Hoả", "Dị Hoả 2 · trắng xương / lam băng, khống chế"],
    ["di-hoa/van-lac", "Vẫn Lạc Tâm Viêm", "Dị Hoả 3 · gần vô sắc, lõi đỏ hồng, đốt dần"],
    ["di-hoa/tam-thien", "Tam Thiên Diễm Viêm Hoả", "Dị Hoả 4 · tím đen, mưa sao lửa"],
    ["di-hoa/tinh-lien", "Tịnh Liên Yêu Hoả", "Dị Hoả 5 · trắng tinh viền vàng nhạt, hoá hư vô"],
  ]],
  ["Tuyệt chiêu", [["ultimate/phat-no-hoa-lien", "Phật Nộ Hoả Liên", "Tuyệt chiêu v3 · đổi 5 màu theo 5 dị hoả"]]],
  ["Đại Hoang", [["ultimate/tu-thien-chi", "Tù Thiên Chỉ", "Đại Hoang · mực đen và vàng kim, nặng, khối"]]],
];
export const SKILLS = GROUPS.flatMap(([group, list]) => list.map(([id, name, sub]) => ({ id, name, sub, group })));
