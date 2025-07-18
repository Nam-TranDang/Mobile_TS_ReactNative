// this func will convert createAt date to the following format: "May 2023"
export function formatMemberSince(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  return `${month} ${year}`;
}
// this function will convert the createdAt to this format: "May 15, 2023"
export function formatPublishDate(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleString("default", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
// In ra ngay thang nam
export function formatRelativeTime(dateString) {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays >= 1) {
    // Trên 1 ngày
    return `${formatPublishDate(dateString)}`;
  } else if (diffHours >= 1) {
    // Trên hoặc bằng 1 giờ
    return `Đã đăng ${diffHours} giờ trước`;
  } else if (diffMinutes >= 1) {
    // Dưới 1 giờ
    return `Đã đăng ${diffMinutes} phút trước`;
  } else {
    return `Vừa đăng`;
  }
}
