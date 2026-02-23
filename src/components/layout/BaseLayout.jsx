import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Plane,
    Activity,
    Server,
    Settings,
    Globe,
    FileText,
} from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarInset,
    useSidebar
} from "../ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../ui/collapsible";
import { Separator } from "../ui/separator";
import { ChevronRight, ChevronLeft, PanelLeft } from "lucide-react";

// Internal component to access Sidebar Context
function SidebarPlatformTrigger() {
    const { toggleSidebar, state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={toggleSidebar}
                tooltip="Toggle Sidebar"
                className="font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
                {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                <span>Collapse Sidebar</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function BaseLayout() {
    const location = useLocation();

    // Navigation Data Structure
    const navMain = [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            items: [] // No sub-items
        },
        {
            title: "Services",
            icon: Server, // Generic icon for services
            items: [
                { title: "Flight Data", url: "/flight-data", icon: Plane },
                { title: "LTN", url: "/ltn", icon: Activity },
                { title: "ANS", url: "/ans", icon: Globe },
                { title: "Surveys", url: "/surveys", icon: FileText },
            ]
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            items: []
        },
    ];

    // Helper to find current page name from nested structure
    const findCurrentPageName = () => {
        if (location.pathname === '/') return 'Dashboard';
        for (const group of navMain) {
            if (group.url === location.pathname) return group.title;
            if (group.items) {
                const subItem = group.items.find(item => item.url === location.pathname);
                if (subItem) return subItem.title;
            }
        }
        return 'Dashboard';
    };

    const currentPathName = findCurrentPageName();
    const isDashboard = location.pathname === '/';
    const isSettings = location.pathname === '/settings';

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-2 text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-semibold">MockSimulator</span>
                            <span className="truncate text-xs">v1.0.0</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                            {/* Dynamic Trigger replacing static label */}
                            <SidebarPlatformTrigger />

                            {navMain.map((item) => {
                                // If item has sub-items, render collapsible
                                if (item.items && item.items.length > 0) {
                                    return (
                                        <Collapsible
                                            key={item.title}
                                            asChild
                                            defaultOpen={true} // Keep Services open by default or false
                                            className="group/collapsible"
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                                                    <Link to={subItem.url}>
                                                                        {/* Optional: <subItem.icon /> inside submenu? Usually just text */}
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    );
                                }

                                // Else render single item
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link to={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-20 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-20 ">
                    {/* Header SidebarTrigger removed/hidden as per request, logic moved to Platform button */}
                    {/* <SidebarTrigger className="-ml-1" /> */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                {isDashboard ? (
                                    <BreadcrumbPage className="text-lg font-semibold">Dashboard</BreadcrumbPage>
                                ) : isSettings ? (
                                    <BreadcrumbPage className="text-lg font-semibold">Settings</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild className="text-lg font-semibold">
                                        <Link to="/">Services</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isDashboard && !isSettings && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{currentPathName}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto flex items-center px-4">
                        <img src="/Brand.png" alt="Brand Logo" className="h-16 w-auto object-contain" />
                    </div>
                </header>
                <div className="flex-1 flex flex-col min-h-0 bg-muted/20">
                    <main className="flex-1 p-6 md:p-8 overflow-auto">
                        <div className="mx-auto max-w-7xl">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
