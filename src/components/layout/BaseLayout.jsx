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
    Moon,
    Sun,
    Terminal,
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
import DockerSetupGuide from '../DockerSetupGuide';
import InteractiveDockerGuide from '../common/InteractiveDockerGuide';
import { useSocket } from '../../contexts/SocketContext';

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
                { title: "Flight Data", url: "/flight-data", icon: Plane, serviceName: 'flightdataservice' },
                { title: "ANS", url: "/ans", icon: Globe, serviceName: 'ans' },
                { title: "LTN", url: "/ltn", icon: Activity, serviceName: 'ltn' },
                { title: "Surveys", url: "/surveys", icon: FileText, serviceName: 'surveys' },
                { title: "Pacio-Server", url: "/crew-terminal", icon: Terminal, serviceName: 'pacio-server' }, // Assuming crew terminal is the main interface for pacio-server
            ]
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            items: []
        },
        {
            title: "Crew Terminal",
            icon: Terminal,
            items: [
                { title: "PACIO-Events", url: "/crew-terminal", icon: Plane},
                {title: "Messaging", url: "/crew-terminal/messaging", icon: Terminal}
            ]
        }
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

    // Docker check
    const { socket, dockerStatus, checkDockerStatus, services } = useSocket();
    const isDockerAvailable = dockerStatus.loading || (dockerStatus.installed && dockerStatus.running);
    const [wasBlocked, setWasBlocked] = React.useState(false);

    // Theme state
    const [isDark, setIsDark] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    React.useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    // Track if we were blocked by the Docker UI, so we can refresh when we recover
    React.useEffect(() => {
        if (!isDockerAvailable) {
            setWasBlocked(true);
        } else if (isDockerAvailable && wasBlocked) {
            // We recovered! Tell the backend to force everyone to re-fetch container statuses
            if (socket) {
                // Emitting an arbitrary docker-action just to trigger the socket's status-refresh cascade
                // A better approach if you have an explicit refresh event on the server
                socket.emit('docker-action', { service: null, action: 'refresh_override' });
            }
            setWasBlocked(false);
        }
    }, [isDockerAvailable, wasBlocked, socket]);

    return (
        <SidebarProvider>
            {!isDockerAvailable && (
                <DockerSetupGuide
                    status={dockerStatus}
                    onRetry={checkDockerStatus}
                />
            )}
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
                                                        {item.items.map((subItem) => {
                                                            const serviceData = services?.find(s => s.name === subItem.serviceName);
                                                            const isRunning = serviceData?.status === 'running';

                                                            return (
                                                                <SidebarMenuSubItem key={subItem.title}>
                                                                    <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                                                        <Link to={subItem.url} className="flex items-center justify-between w-full">
                                                                            <span>{subItem.title}</span>
                                                                            {subItem.serviceName && (
                                                                                <div className="flex items-center">
                                                                                    {/* Glowing dot indicator */}
                                                                                    <span className="relative flex h-2.5 w-2.5 ml-2">
                                                                                        {isRunning && (
                                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                                        )}
                                                                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            );
                                                        })}
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
                    <div className="ml-auto flex items-center px-4 gap-4">
                        <InteractiveDockerGuide />
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
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
