"use client";

import { Button } from "@/components/ui/Button";

export default function CreateClassPopupButton() {
  const handleClick = () => {
    const width = 720;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      "/create-class",
      "create-class",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <Button variant="primary" type="button" onClick={handleClick}>
      수업 생성
    </Button>
  );
}

