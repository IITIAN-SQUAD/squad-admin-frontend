import { UserLock, Group, File } from "lucide-react";

export interface SidebarLink {
    title: string;
    url: string;
    icon: React.ElementType;
}

export const SIDEBAR_LINKS = {
    adminManagement: [
        {
            title: "Admin List",
            url: "/admin",
            icon: UserLock
        }
    ],
    contentManagement: [
        {
            title: "Category listing",
            url: "/content/category-listing",
            icon: Group
        },
        {
            title: "Blog management",
            url: "/blog-management",
            icon: File
        }
    ]
}