import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import CreateBoard from "./pages/CreateBoard";
import MusicSearch from "./pages/MusicSearch";
import ArtistDetail from "./pages/ArtistDetail";
import AlbumDetail from "./pages/AlbumDetail";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import Concerts from "./pages/Concerts";
import Lists from "./pages/Lists";
import Boards from "./pages/Boards";
import BoardDetail from "./pages/BoardDetail";
import Reviews from "./pages/Reviews";
import Albums from "./pages/Albums";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-board" element={<CreateBoard />} />
          <Route path="/music-search" element={<MusicSearch />} />
          <Route path="/artist/:artistId" element={<ArtistDetail />} />
          <Route path="/album/:albumId" element={<AlbumDetail />} />
          <Route path="/album-detail/:albumId" element={<AlbumDetailPage />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/boards/:boardId" element={<BoardDetail />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/albums" element={<Albums />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
