'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pencil, 
  UserPlus, 
  Trash, 
  Search, 
  PlusCircle, 
  Share2,
  LayoutTemplate,
  Calendar,
  Shield,
  Users
} from "lucide-react";
import { BACKEND_URL } from '../../config';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface Room {
  _id: string;
  slug: string;
  createdAt: string;
  adminId: any; 
  collaborators?: any[]; 
}

const UserTooltip = ({ users }: { users: { name: string; id: string }[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const bgColors = ['bg-pink-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-cyan-500'];

  return (
    <div className="flex flex-row items-center justify-start">
      {users.slice(0, 4).map((user, idx) => (
        <div
          className="-mr-3 relative group cursor-pointer"
          key={user.id}
          onMouseEnter={() => setHoveredIndex(user.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === user.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 flex text-[10px] flex-col items-center justify-center rounded bg-popover text-popover-foreground border z-[100] shadow-xl px-2 py-1 whitespace-nowrap"
              >
                <div className="font-bold uppercase tracking-tighter">{user.name}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={cn(
            "h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm transition-transform hover:scale-110 z-0 hover:z-10",
            bgColors[idx % bgColors.length]
          )}>
            {user.name ? user.name.charAt(0) : "?"}
          </div>
        </div>
      ))}
      {users.length > 4 && (
         <div className="h-8 w-8 -ml-3 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground z-10">
           +{users.length - 4}
         </div>
      )}
    </div>
  );
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const [token, setToken] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomSlug, setRoomSlug] = useState('');
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [userData, setUserData] = useState<{ name: string; photo?: string } | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [collabUsername, setCollabUsername] = useState('');
  const [collabUseremail, setCollabUseremail] = useState('');

  const [loadingRooms, setLoadingRooms] = useState(true);
  const toastOptions = { position: 'top-right' as const, autoClose: 2000, theme: 'dark' as const };

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const storageToken = localStorage.getItem('token');
    const savedToken = storageToken || urlToken;

    if (savedToken) {
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setToken(savedToken);
      fetchRooms(savedToken);
      fetchUserProfile(savedToken);
    } else {
      router.push('/auth');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter(r => r.slug.toLowerCase().includes(searchQuery.toLowerCase())));
    }
  }, [searchQuery, rooms]);

  const fetchRooms = async (activeToken: string) => {
    setLoadingRooms(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/my-rooms`, {
        // 👇 ADD "Bearer " HERE
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setRooms(res.data.rooms);
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoadingRooms(false); }
  };

  const fetchUserProfile = async (activeToken: string) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.data.user) {
        setUserData({
          name: res.data.user.name,
          photo: res.data.user.photo || undefined,
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setUserData(null);
    }
  };

  const getUserIdFromToken = () => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).userId; } catch (e) { return null; }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName || !token) return;
    setCreating(true);
    try {
      await axios.post(`${BACKEND_URL}/create-room`, { name: newRoomName }, { headers: {Authorization: `Bearer ${token}` } });
      toast.success('Room created!', toastOptions);
      setNewRoomName('');
      setShowCreateDialog(false);
      fetchRooms(token);
    } catch (e: any) { toast.error('Error creating room', toastOptions); }
    finally { setCreating(false); }
  };

  const joinRoom = async () => {
    if (!roomSlug) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/room/${roomSlug}`);
      if (res.data.room?._id) router.push(`/canvas/${res.data.room._id}`);
    } catch (e) { toast.error("Room not found", toastOptions); }
  };

  const deleteRoom = (roomId: string) => {
    axios.delete(`${BACKEND_URL}/room/${roomId}`, { headers: {Authorization: `Bearer ${token!}` } })
    .then(() => {
      toast.success("Room deleted successfully");
      fetchRooms(token!);
    })
    .catch(() => toast.error("Failed to delete room"));
  };

  return (
    <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden border-x border-border bg-background md:flex-row h-screen text-foreground">
      <AppSidebar onLogout={() => { localStorage.removeItem('token'); router.push('/auth'); }} user={userData} />

      <div className="flex flex-1 flex-col overflow-y-auto bg-background relative">
        
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6 sticky top-0 z-10 bg-background/80 backdrop-blur-sm gap-4">
          <Breadcrumb className="hidden lg:block">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Workspace</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-6 space-y-8 flex-1 flex flex-col">
          
          {/* SEARCH & ACTIONS BAR */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/40 border-border text-foreground h-11 rounded-lg focus-visible:ring-primary/20"
                />
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-auto">
                    <Input 
                      placeholder="Enter Room ID" 
                      value={roomSlug} 
                      onChange={(e) => setRoomSlug(e.target.value)}
                      className="bg-muted/40 border-border h-11 w-full md:w-48 pr-16 rounded-lg" 
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={joinRoom} 
                      className="absolute right-1 top-1.5 h-8 text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/10"
                    >
                      JOIN
                    </Button>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="h-11 px-6 rounded-lg gap-2 shadow-lg shadow-primary/20">
                   <PlusCircle className="h-4 w-4" /> <span className="font-semibold">Create</span>
                </Button>
             </div>
          </div>

          {/* GRID CONTENT */}
          {loadingRooms ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
             </div>
          ) : rooms.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center flex-1 space-y-6 py-12">
               <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center">
                 <LayoutTemplate className="h-12 w-12 text-muted-foreground/50" />
               </div>
               <div className="text-center space-y-2">
                 <h2 className="text-2xl font-bold tracking-tight">No rooms found</h2>
                 <p className="text-muted-foreground">Create your first canvas to get started.</p>
               </div>
               <Button size="lg" onClick={() => setShowCreateDialog(true)}>Create Room</Button>
            </div>
          ) : filteredRooms.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">No rooms match your search.</div>
          ) : (
            /* ROOMS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {filteredRooms.map((room) => {
                 const currentUserId = getUserIdFromToken();
                 const isAdmin = (room.adminId?._id || room.adminId) === currentUserId;
                 const allUsers = [
                    { name: room.adminId?.name || "Admin", id: room.adminId?._id || "admin" },
                    ...(room.collaborators?.map((c: any) => ({ name: c.name || "User", id: c._id })) || [])
                 ];

                 return (
                   <Card key={room._id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 flex flex-col justify-between">
                      <CardHeader className="p-5 pb-2">
                         <div className="flex items-start justify-between">
                            <div className="space-y-1">
                               <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(`/canvas/${room._id}`)}>
                                 {room.slug}
                               </h3>
                               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                               </div>
                            </div>
                            
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Options</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/canvas/${room._id}`)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedRoom(room); setShowAddUserDialog(true); }}>
                                  <UserPlus className="mr-2 h-4 w-4" /> Invite
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/canvas/${room._id}`);
                                  toast.success("Link copied!");
                                }}>
                                  <Share2 className="mr-2 h-4 w-4" /> Share
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => deleteRoom(room._id)} className="text-destructive focus:text-destructive">
                                      <Trash className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </CardHeader>
                      
                      <CardContent className="p-5 pt-4">
                         <div className="flex items-center gap-2 mb-4">
                           {isAdmin ? (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                               <Shield className="w-3 h-3 mr-1" /> ADMIN
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                               <Users className="w-3 h-3 mr-1" /> MEMBER
                             </span>
                           )}
                         </div>
                         <UserTooltip users={allUsers} />
                      </CardContent>

                      <CardFooter className="p-0">
                         <Button 
                           variant="secondary" 
                           className="w-full rounded-none h-10 bg-muted/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                           onClick={() => router.push(`/canvas/${room._id}`)}
                         >
                           Enter Room
                         </Button>
                      </CardFooter>
                   </Card>
                 );
              })}
            </div>
          )}
        </main>
      </div>

      {/* DIALOGS */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input 
                placeholder="e.g. Brainstorming Session" 
                value={newRoomName} 
                onChange={e => setNewRoomName(e.target.value)} 
                className="col-span-3 bg-background border-input text-foreground"
                autoFocus
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleCreateRoom} disabled={creating || !newRoomName}>
            {creating ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="rounded-lg">
          <DialogHeader><DialogTitle>Invite to {selectedRoom?.slug}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
             <div className="space-y-1">
               <Label>Name</Label>
               <Input placeholder="John Doe" value={collabUsername} onChange={e => setCollabUsername(e.target.value)} className="bg-background"/>
             </div>
             <div className="space-y-1">
               <Label>Email</Label>
               <Input placeholder="john@example.com" value={collabUseremail} onChange={e => setCollabUseremail(e.target.value)} className="bg-background"/>
             </div>
          </div>
          <Button className="w-full" onClick={() => setShowAddUserDialog(false)}>Send Invitation</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Skeleton className="h-12 w-12 rounded-full" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}