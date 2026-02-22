'use client';

import React, { useEffect, useState } from 'react';
import { useParams} from 'next/navigation';
import PlayerCard from '@/components/PlayerCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UniversalLoader from '@/components/ui/universal-loader';
import { ArrowLeft, IndianRupee, Users } from 'lucide-react';
import Link from 'next/link';
import axiosClient from '@/app/client/axiosClient';
import { Team } from '@/app/types/type';




const TeamDetail = () => {
  const params = useParams();
  const id = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTeam = async () => {
      try {
        const response = await axiosClient.get<Team>(`/api/auction/teams/${id}`);
        setTeam(response.data);
      } catch (err) {
        const error = err as { response?: { status: number } };
        setError(error.response?.status === 404 ? 'Team not found' : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  if (loading) {
    return <UniversalLoader fullScreen message="Loading team details..." subtitle="Preparing squad view" size="lg" />;
  }

  if (error) {
    return (
      <div className="theme-page-bg min-h-screen flex items-center justify-center text-foreground">
        <div className="absolute inset-0 theme-grid-overlay pointer-events-none" />
        <div className="text-center max-w-md mx-4 relative z-10">
          <div className="inline-block p-4 bg-destructive/20 rounded-full mb-4 border border-destructive/40">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{error}</h2>
          <p className="theme-muted mb-6">The team you&apos;re looking for doesn’t exist.</p>
          <Link href="/teams">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-page-bg min-h-screen text-foreground relative">
      <div className="absolute inset-0 theme-grid-overlay pointer-events-none" />
      <div className="container mx-auto px-4 py-6">
        <Link href="/teams">
  <Button
    variant="outline"
    size="sm"
    className="mb-6 gap-2 border-border text-foreground hover:bg-muted"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to Teams
  </Button>
</Link>


        {/* Team Header Card */}
        <Card className="theme-card-strong mb-8 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {team?.captainImage ? (
                <img
                  src={team.captainImage}
                  alt={team.captainName}
                  className="w-24 h-24 rounded-full border-4 border-primary/40 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/15 border-4 border-primary/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {team?.captainName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {team?.name}
                </h1>
                <p className="text-lg theme-muted mt-1">Captain: {team?.captainName}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-4 p-4 theme-card border border-border rounded-xl">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm theme-muted">Remaining Purse</p>
                  <p className="text-2xl font-bold text-primary">₹{team?.currentPurse.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 theme-card border border-border rounded-xl">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm theme-muted">Total Players</p>
                  <p className="text-2xl font-bold text-accent">{team?.players?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Squad Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Team Squad</h2>
          <p className="theme-muted">Players in this team</p>
        </div>

        {team?.players?.length === 0 ? (
          <Card className="theme-card p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="theme-muted text-lg">No players in this team yet</p>
            <p className="text-muted-foreground mt-2">Players will appear after the auction begins.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team?.players?.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
