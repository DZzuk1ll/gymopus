"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gymopus_disclaimer_accepted";

export function DisclaimerDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>免责声明</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            本工具不提供医疗建议。如有健康问题，请咨询专业医生。
          </p>
          <p>
            训练和饮食建议仅供参考，用户应根据自身实际情况进行判断和调整。
          </p>
          <p>
            如有伤病史，请在画像中标注。但本工具不能替代物理治疗师或康复专家的专业指导。
          </p>
          <p>
            本工具使用 AI 生成内容，可能存在错误或不准确之处。
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleAccept} className="w-full">
            我已了解
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
