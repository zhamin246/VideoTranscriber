import { getUserUuid } from "@/services/user";
import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/console/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getTranslations } from "next-intl/server";
import moment from "moment";
import { redirect } from "next/navigation";
import { getGenerationRecordsByUser } from "@/models/generation-record";

export default async function UserGenerationRecordsPage() {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/user-generation-records`;
  
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // 获取真实的生成记录
  const generationRecords = await getGenerationRecordsByUser(user_uuid);

  const columns: TableColumn[] = [
    { name: "id", title: t("user_generation_records.table.id") },
    { name: "type", title: t("user_generation_records.table.type") },
    { name: "prompt", title: t("user_generation_records.table.prompt") },
    { name: "status", title: t("user_generation_records.table.status") },
    {
      name: "created_at",
      title: t("user_generation_records.table.created_at"),
      callback: (item: any) =>
        moment(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      name: "credits_used",
      title: t("user_generation_records.table.credits_used"),
      callback: (item: any) => `${item.credits_used} Credits`,
    },
    {
      name: "result_url",
      title: t("user_generation_records.table.actions"),
      callback: (item: any) => {
        if (item.status === "completed" && item.result_url) {
          // 检查是否过期（7天）
          const createdAt = new Date(item.created_at);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 7) {
            return (
              <span className="text-red-500 text-sm">
                {t("user_generation_records.table.expired")}
              </span>
            );
          }
          
          return (
            <a 
              href={item.result_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              {t("user_generation_records.table.download")}
            </a>
          );
        }
        return item.status === "failed" ? t("user_generation_records.table.failed") : "-";
      },
    },
  ];

  const table: TableSlotType = {
    title: t("user_generation_records.title"),
    description: t("user_generation_records.description"),
    toolbar: {
      items: [
        {
          title: t("user_generation_records.refresh"),
          icon: "RiRefreshLine",
          url: "/user-generation-records",
          variant: "default",
        },
      ],
    },
    columns: columns,
    data: generationRecords,
    empty_message: t("user_generation_records.no_records"),
  };

  return (
    <div className="pt-8 px-6">
      <TableSlot {...table} />
    </div>
  );
}
