"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../components/layout/Header";
import TabNav from "../components/layout/TabNav";
import MemberOverviewCard from "../components/overview/TierCard";
import GroupTotal from "../components/overview/GroupTotal";
import RateInput from "../components/overview/RateInput";
import CostTable from "../components/costs/CostTable";
import CompareTable from "../components/compare/CompareTable";
import FeatureMatrix from "../components/compare/FeatureMatrix";
import Timeline from "../components/itinerary/Timeline";
import SavingsTab from "../components/savings/SavingsTab";
import TipsTab from "../components/tips/TipsTab";
import MembersTab from "../components/members/MembersTab";
import BebbyChat from "../components/chat/BebbyChat";
import Landing from "../components/landing/Landing";
import MemberProfile from "../components/members/MemberProfile";
import AnimateIn, { staggerDelay } from "../components/ui/AnimateIn";
import MemberFilter from "../components/ui/MemberFilter";
import { useTrip } from "../hooks/useTrip";
import { useBudgetItems } from "../hooks/useBudgetItems";
import { useItinerary } from "../hooks/useItinerary";
import { useLinks } from "../hooks/useLinks";
import { useChats } from "../hooks/useChats";
import { useMembers } from "../hooks/useMembers";
import type { TabKey } from "../lib/constants";
import type { Member } from "../lib/supabase/types";

export default function BudgetApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showLanding, setShowLanding] = useState(true);
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const { trip, loading: tripLoading, updateTrip } = useTrip();
  const { items, loading: itemsLoading, updateItem, addItem, deleteItem } = useBudgetItems(trip?.id);
  const { days, updateDay, addDay, deleteDay, swapDays } = useItinerary(trip?.id);
  const { links, addLink, updateLink, deleteLink } = useLinks(trip?.id);
  const { members, addMember, updateMember, deleteMember } = useMembers(trip?.id);

  // Strip a member from all budget items' member_ids
  const removeMemberFromItems = useCallback(
    (memberId: string) => {
      for (const item of items) {
        if (item.member_ids && item.member_ids.includes(memberId)) {
          const updated = item.member_ids.filter((id) => id !== memberId);
          updateItem(item.id, { member_ids: updated.length > 0 ? updated : null });
        }
      }
      if (selectedMembers.includes(memberId)) setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    },
    [items, updateItem, selectedMembers]
  );

  const handleUpdateMember = useCallback(
    async (id: string, updates: Partial<Member>) => {
      await updateMember(id, updates);
      if (updates.is_active === false) removeMemberFromItems(id);
    },
    [updateMember, removeMemberFromItems]
  );

  const handleDeleteMember = useCallback(
    async (id: string) => {
      removeMemberFromItems(id);
      await deleteMember(id);
    },
    [deleteMember, removeMemberFromItems]
  );
  const {
    chats, activeChat, activeChatId, setActiveChatId,
    createChat, updateChat, deleteChat,
  } = useChats(trip?.id);

  const activeMemberCount = useMemo(() => members.filter((m) => m.is_active).length, [members]);
  const groupSize = activeMemberCount || (trip?.group_size ?? 7);
  const usdToTtd = trip?.usd_to_ttd ?? 6.8;
  const loading = tripLoading || itemsLoading;

  // Sync group_size in DB when active members change
  useEffect(() => {
    if (activeMemberCount > 0 && trip && activeMemberCount !== trip.group_size) {
      updateTrip({ group_size: activeMemberCount });
    }
  }, [activeMemberCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading budget data...</p>
        </div>
      </div>
    );
  }

  // Landing page
  if (showLanding) {
    return (
      <Landing
        members={members}
        onEnter={() => setShowLanding(false)}
        onMemberClick={(id) => {
          setProfileMemberId(id);
          setShowLanding(false);
        }}
      />
    );
  }

  // Member profile view
  if (profileMemberId) {
    const profileMember = members.find((m) => m.id === profileMemberId);
    if (profileMember) {
      return (
        <MemberProfile
          member={profileMember}
          members={members}
          items={items}
          usdToTtd={usdToTtd}
          tripStart={trip?.trip_start ?? null}
          onBack={() => setProfileMemberId(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header trip={trip} onUpdate={updateTrip} onOpenChat={() => setChatOpen(true)} onLogoClick={() => setShowLanding(true)} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <AnimateIn key={activeTab} animation="fade-up" className="contents">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <RateInput
              rate={usdToTtd}
              onSave={(rate) => updateTrip({ usd_to_ttd: rate })}
            />
            <MemberFilter members={members} selected={selectedMembers} onChange={setSelectedMembers} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.filter((m) => m.is_active).filter((m) => selectedMembers.length === 0 || selectedMembers.includes(m.id)).map((member, i) => (
                <AnimateIn key={member.id} animation="fade-up" delay={staggerDelay(i, 80)}>
                  <MemberOverviewCard
                    member={member}
                    items={items}
                    activeMembers={members.filter((m) => m.is_active)}
                    usdToTtd={usdToTtd}
                  />
                </AnimateIn>
              ))}
            </div>
            <AnimateIn animation="fade-up" delay={320}>
              <GroupTotal items={items} groupSize={groupSize} usdToTtd={usdToTtd} members={members} selectedMembers={selectedMembers} />
            </AnimateIn>
          </div>
        )}

        {activeTab === "costs" && trip && (
          <CostTable
            items={items}
            members={members}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onAdd={addItem}
            tripId={trip.id}
          />
        )}

        {activeTab === "compare" && (
          <div className="space-y-6">
            <AnimateIn animation="fade-up">
              <CompareTable items={items} groupSize={groupSize} usdToTtd={usdToTtd} members={members} />
            </AnimateIn>
            <AnimateIn animation="fade-up" delay={120}>
              <FeatureMatrix items={items} />
            </AnimateIn>
          </div>
        )}

        {activeTab === "itinerary" && trip && (
          <Timeline days={days} tripId={trip.id} onUpdate={updateDay} onAdd={addDay} onDelete={deleteDay} onSwap={swapDays} />
        )}

        {activeTab === "savings" && (
          <SavingsTab
            items={items}
            groupSize={groupSize}
            usdToTtd={usdToTtd}
            tripStart={trip?.trip_start ?? null}
            members={members}
            selectedMembers={selectedMembers}
            onMemberChange={setSelectedMembers}
          />
        )}

        {activeTab === "members" && trip && (
          <MembersTab
            members={members}
            tripId={trip.id}
            onAdd={addMember}
            onUpdate={handleUpdateMember}
            onDelete={handleDeleteMember}
            onViewProfile={(id) => setProfileMemberId(id)}
          />
        )}

        {activeTab === "tips" && trip && (
          <TipsTab links={links} tripId={trip.id} onAdd={addLink} onUpdate={updateLink} onDelete={deleteLink} />
        )}
        </AnimateIn>
      </main>

      <footer className="bg-black border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        FLYU Nation • Outpace | Outplay • Orlando 2027
      </footer>

      <BebbyChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        chats={chats}
        activeChat={activeChat}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        createChat={createChat}
        updateChat={updateChat}
        deleteChat={deleteChat}
      />
    </div>
  );
}
