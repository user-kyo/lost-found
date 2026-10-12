import React from "react";
import { useApp } from "../../context/AppContext";
import { X, Bell, CheckCheck, Sparkles, AlertTriangle, Shield, Clock } from "lucide-react";

export const NotificationDrawer: React.FC = () => {
  const { 
    isNotifDrawerOpen, 
    setIsNotifDrawerOpen, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    setStudentView,
    setStaffView,
    role,
    setSelectedClaim,
    claims
  } = useApp();

  if (!isNotifDrawerOpen) return null;

  const filteredNotifs = notifications.filter(
    n => n.recipientRole === role || n.recipientRole === "all"
  );

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.relatedClaimId) {
      const claim = claims.find(c => c.id === notif.relatedClaimId);
      if (claim) {
        setSelectedClaim(claim);
        if (role === "student") {
          setStudentView("claim_tracking");
        } else {
          setStaffView("claim_requests");
        }
      }
    } else if (notif.relatedItemId) {
      if (role === "student") {
        setStudentView("search");
      } else {
        setStaffView("found_items");
      }
    }
    setIsNotifDrawerOpen(false);
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotifDrawerOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Notifications</h3>
                <p className="text-xs text-stone-500">
                  {role === "student" ? "Citizen Alerts & Retrieval Updates" : "LGU Operations & Storage Events"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotifDrawerOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-semibold">
              {filteredNotifs.filter(n => !n.read).length} Unread Alerts
            </span>
            <button
              onClick={markAllNotificationsRead}
              className="text-blue-800 hover:text-blue-950 font-bold flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 sm:p-4 space-y-2">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No notifications right now.</p>
              </div>
            ) : (
              filteredNotifs.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !notif.read
                      ? "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
                      : "bg-white border-stone-200/70 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {notif.type === "match_found" && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {notif.type === "claim_update" && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {notif.type === "staff_action" && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {notif.type === "system_alert" && (
                        <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${!notif.read ? "text-stone-900" : "text-stone-700"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <div className="mt-2 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                          <span className="text-[10px] font-bold text-blue-800">Click to view details</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
