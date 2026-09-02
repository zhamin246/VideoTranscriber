import Empty from "@/components/blocks/empty";
import TableSlot from "@/components/console/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getCreditsByUserUuid, getCreditsCountByUserUuid } from "@/models/credit";
import { getTranslations } from "next-intl/server";
import { getUserCredits } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import moment from "moment";
import { Pagination } from "@/components/ui/pagination";

export default async function ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations();
  const { page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const limit = 10; // 每页显示10条记录，这样16条记录会有2页

  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return <Empty message="no auth" />;
  }

  const data = await getCreditsByUserUuid(user_uuid, currentPage, limit);
  const userCredits = await getUserCredits(user_uuid);
  
  // 获取总记录数
  const totalCount = await getCreditsCountByUserUuid(user_uuid);
  const totalPages = Math.ceil(totalCount / limit);

  const table: TableSlotType = {
    title: t("my_credits.title"),
    tip: {
      title: t("my_credits.left_tip", {
        left_credits: userCredits?.left_credits || 0,
      }),
    },
    toolbar: {
      items: [
        {
          title: t("my_credits.recharge"),
          url: "/pricing",
          target: "_blank",
          icon: "RiBankCardLine",
        },
      ],
    },
    columns: [
      {
        title: t("my_credits.table.trans_no"),
        name: "trans_no",
      },
      {
        title: t("my_credits.table.trans_type"),
        name: "trans_type",
      },
      {
        title: t("my_credits.table.credits"),
        name: "credits",
      },
      {
        title: t("my_credits.table.created_at"),
        name: "created_at",
        callback: (v: any) => {
          return moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
        },
      },
      {
        title: t("my_credits.table.expired_at"),
        name: "expired_at",
        callback: (v: any) => {
          if (!v.expired_at) {
            return "-";
          }

          const t = moment(v.expired_at);

          return `${t.format("YYYY-MM-DD HH:mm:ss")} (${t.fromNow()})`;
        },
      },
    ],
    data,
    empty_message: t("my_credits.no_credits"),
  };

  return (
    <div className="space-y-6">
      <TableSlot {...table} />
      
      {/* 分页组件 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/my-credits"
          />
        </div>
      )}
    </div>
  );
}
