import React from "react";

export interface PrismIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  active?: boolean;
}
