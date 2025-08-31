import { UserLock, Group, File, Users } from "lucide-react";

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
        },
        {
            title: "Author management",
            url: "/author-management",
            icon: Users
        }
    ]
}