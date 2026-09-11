import { Trophy } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import {
  inputClassName,
  labelClassName,
  validateNonNegativeInt,
} from "../form-utils";
import { FieldError, SectionCard } from "../section-card";

export function RankAchievementSection() {
  const values = useAdminSystemConfigFormStore((s) => s.values);
  const setRankAchievement = useAdminSystemConfigFormStore(
    (s) => s.setRankAchievement,
  );

  return (
    <SectionCard icon={Trophy} title="Rank Achievement">
      <div>
        <label htmlFor="rank-qualification-days" className={labelClassName}>
          Qualification Window (days)
        </label>
        <input
          id="rank-qualification-days"
          type="number"
          value={values.RANK_ACHIEVEMENT.QUALIFICATION_DAYS}
          onChange={(e) =>
            setRankAchievement({ QUALIFICATION_DAYS: e.target.value })
          }
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(
            values.RANK_ACHIEVEMENT.QUALIFICATION_DAYS,
          )}
        />
      </div>

      <div>
        <label htmlFor="rank-star-business" className={labelClassName}>
          Star Rank Business Required ($)
        </label>
        <input
          id="rank-star-business"
          type="number"
          value={values.RANK_ACHIEVEMENT.STAR_BUSINESS_REQUIRED}
          onChange={(e) =>
            setRankAchievement({ STAR_BUSINESS_REQUIRED: e.target.value })
          }
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="rank-legs-required" className={labelClassName}>
          Legs Required (above Star)
        </label>
        <input
          id="rank-legs-required"
          type="number"
          value={values.RANK_ACHIEVEMENT.LEGS_REQUIRED}
          onChange={(e) =>
            setRankAchievement({ LEGS_REQUIRED: e.target.value })
          }
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(
            values.RANK_ACHIEVEMENT.LEGS_REQUIRED,
          )}
        />
      </div>
    </SectionCard>
  );
}
