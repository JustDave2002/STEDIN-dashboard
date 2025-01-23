"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ArrowUp, ArrowDown, ChevronLeft } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatDistanceToNow } from "date-fns";

export default function DeviceTable({
                                      devices,
                                      isInstallMode,
                                      onDeviceToggle,
                                      selectedDevices,
                                    }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showAppIframe, setShowAppIframe] = useState(false);

  // Sorting config and logic
  const [sortConfig, setSortConfig] = useState({
    key: "gemeente",
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prevState) => {
      let direction = "asc";
      if (prevState.key === key && prevState.direction === "asc") {
        direction = "desc";
      }
      return { key, direction };
    });
  };

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "name": {
          const extractNumber = (name) => {
            const match = name.match(/MSR_(\d+)/);
            return match ? parseInt(match[1], 10) : name;
          };
          aValue = extractNumber(a.name);
          bValue = extractNumber(b.name);
          break;
        }
        case "gemeente": {
          const aGemeenteTag = a.tags.find((tag) => tag.type === "location");
          const bGemeenteTag = b.tags.find((tag) => tag.type === "location");
          aValue = aGemeenteTag ? aGemeenteTag.name : "";
          bValue = bGemeenteTag ? bGemeenteTag.name : "";
          break;
        }
        case "last_contact": {
          aValue = new Date(a.last_contact);
          bValue = new Date(b.last_contact);
          break;
        }
        case "tags": {
          aValue = a.tags.map((tag) => tag.name).join(", ");
          bValue = b.tags.map((tag) => tag.name).join(", ");
          break;
        }
        case "status": {
          aValue = a.status;
          bValue = b.status;
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [devices, sortConfig]);

  // Virtualization
  const parentRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        // You can adjust this as needed
        setHeaderHeight(211);
      });
      resizeObserver.observe(headerRef.current);

      return () => {
        if (headerRef.current) {
          resizeObserver.unobserve(headerRef.current);
        }
      };
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: sortedDevices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  // Fetching logs
  const fetchDeviceLogs = async (deviceId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
          `http://localhost:8000/logs?device_id=${deviceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching device logs:", error);
      setLogs([]);
    }
  };

  const fetchAppInstanceLogs = async (appInstanceId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
          `http://localhost:8000/logs?app_instance_id=${appInstanceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching application instance logs:", error);
      setLogs([]);
    }
  };

  // Row and Modal Handling
  const handleRowClick = async (device) => {
    setSelectedDevice(device);
    setSelectedApplication(null);
    setShowAppIframe(false);
    setLogs([]);
    await fetchDeviceLogs(device.id);
  };

  const handleApplicationClick = async (application, device) => {
    setSelectedApplication({ ...application, parentDevice: device });
    setShowAppIframe(false);
    setLogs([]);
    await fetchAppInstanceLogs(application.id);
  };

  const handleCloseModal = () => {
    setSelectedDevice(null);
    setSelectedApplication(null);
    setShowAppIframe(false);
    setLogs([]);
  };

  const handleBackToDevice = async () => {
    if (selectedApplication?.parentDevice) {
      setSelectedApplication(null);
      // Re-open the device modal with logs for that device
      await handleRowClick(selectedApplication.parentDevice);
    }
  };

  const renderLogs = () => {
    return (
        <div>
          <h3 className="font-semibold text-sm mb-2">Logs</h3>
          <ScrollArea className="max-h-40 border border-muted rounded-md p-2">
            {logs && logs.length > 0 ? (
                <ul>
                  {logs.map((log) => (
                      <li key={log.id} className="text-sm mb-1">
                  <span
                      className={`inline-block w-20 font-semibold ${
                          log.warning_level === "error"
                              ? "text-destructive"
                              : log.warning_level === "warning"
                                  ? "text-amber-600"
                                  : log.warning_level === "offline"
                                      ? "text-muted-foreground"
                                      : "text-green-600"
                      }`}
                  >
                    {log.warning_level.toUpperCase()}
                  </span>
                        <span className="inline-block w-40">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                        <span>{log.description}</span>
                      </li>
                  ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No logs available</p>
            )}
          </ScrollArea>
        </div>
    );
  };

  // Helper for install mode opacity
  const getOpacity = (isInstall, isEligible) => {
    return isInstall && !isEligible ? "opacity-25" : "";
  };

  return (
      <div className="flex flex-col">
        {/* Table Header */}
        <div
            ref={headerRef}
            className="border-b bg-background"
            style={{
              display: "grid",
              gridTemplateColumns: isInstallMode
                  ? "15% 25% 15% 15% 10% 10% 10%"
                  : "20% 25% 18% 17% 10% 10%",
              fontWeight: "bold",
              padding: "8px 0",
              flex: "0 0 auto",
            }}
        >
          <div
              onClick={() => handleSort("name")}
              className="cursor-pointer flex items-center justify-start px-2"
          >
            <span>Name</span>
            {sortConfig.key === "name" &&
                (sortConfig.direction === "asc" ? (
                    <ArrowUp className="ml-1 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-1 h-4 w-4" />
                ))}
          </div>
          <div className="px-2">Applications</div>
          <div
              onClick={() => handleSort("gemeente")}
              className="cursor-pointer flex items-center justify-start px-2"
          >
            <span>Gemeente</span>
            {sortConfig.key === "gemeente" &&
                (sortConfig.direction === "asc" ? (
                    <ArrowUp className="ml-1 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-1 h-4 w-4" />
                ))}
          </div>
          <div
              onClick={() => handleSort("tags")}
              className="cursor-pointer flex items-center justify-start px-2"
          >
            <span>Tags</span>
            {sortConfig.key === "tags" &&
                (sortConfig.direction === "asc" ? (
                    <ArrowUp className="ml-1 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-1 h-4 w-4" />
                ))}
          </div>
          <div
              onClick={() => handleSort("last_contact")}
              className="cursor-pointer flex items-center justify-start px-2"
          >
            <span>Last Contact</span>
            {sortConfig.key === "last_contact" &&
                (sortConfig.direction === "asc" ? (
                    <ArrowUp className="ml-1 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-1 h-4 w-4" />
                ))}
          </div>
          <div
              onClick={() => handleSort("status")}
              className="cursor-pointer flex items-center justify-start px-2"
          >
            <span>Status</span>
            {sortConfig.key === "status" &&
                (sortConfig.direction === "asc" ? (
                    <ArrowUp className="ml-1 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-1 h-4 w-4" />
                ))}
          </div>

          {isInstallMode && (
              <div className="cursor-pointer flex items-center justify-start px-2">
                <span>Install</span>
              </div>
          )}
        </div>

        {/* Table Body */}
        <div
            ref={parentRef}
            className="relative"
            style={{
              height: `calc(100vh - ${headerHeight}px)`,
              overflowY: "auto",
            }}
        >
          <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const device = sortedDevices[virtualRow.index];
              return (
                  <div
                      key={device.id}
                      className={`border-b bg-white ${
                          !device.isEligible && isInstallMode
                              ? ""
                              : "hover:bg-accent/50"
                      }`}
                      style={{
                        position: "absolute",
                        left: 0,
                        width: "100%",
                        height: "60px",
                        transform: `translateY(${virtualRow.start}px)`,
                        display: "grid",
                        gridTemplateColumns: isInstallMode
                            ? "15% 25% 15% 15% 10% 10% 10%"
                            : "20% 25% 18% 17% 10% 10%",
                        alignItems: "center",
                        cursor: !isInstallMode ? "pointer" : "default",
                      }}
                      onClick={!isInstallMode ? () => handleRowClick(device) : undefined}
                  >
                    <div
                        className={`px-2 flex items-center ${getOpacity(
                            isInstallMode,
                            device.isEligible
                        )}`}
                    >
                      {device.name}
                    </div>
                    <div
                        className={`px-2 flex flex-wrap items-center gap-1 ${getOpacity(
                            isInstallMode,
                            device.isEligible
                        )}`}
                    >
                      {device.applications.map((app) => (
                          <Badge
                              key={app.id}
                              onClick={
                                !isInstallMode
                                    ? (e) => {
                                      e.stopPropagation();
                                      handleApplicationClick(app, device);
                                    }
                                    : undefined
                              }
                              className={`cursor-pointer bg-white border ${
                                  app.status === "online"
                                      ? "border-green-500 text-green-500"
                                      : app.status === "offline"
                                          ? "border-gray-500 text-gray-500"
                                          : app.status === "warning"
                                              ? "border-yellow-500 text-yellow-500"
                                              : "border-red-500 text-red-500"
                              } px-2 py-1`}
                          >
                            {app.name}
                          </Badge>
                      ))}
                    </div>
                    <div
                        className={`px-2 flex flex-wrap items-center gap-1 ${getOpacity(
                            isInstallMode,
                            device.isEligible
                        )}`}
                    >
                      {device.tags
                          .filter((tag) => tag.type === "location")
                          .map((tag) => (
                              <Badge
                                  key={tag.id}
                                  className="bg-white border border-blue-500 text-blue-500 px-2 py-1"
                              >
                                {tag.name}
                              </Badge>
                          ))}
                    </div>
                    <div
                        className={`px-2 flex flex-wrap items-center gap-1 ${getOpacity(
                            isInstallMode,
                            device.isEligible
                        )}`}
                    >
                      {device.tags
                          .filter((tag) => tag.type !== "location")
                          .map((tag) => (
                              <Badge
                                  key={tag.id}
                                  className={`bg-white border ${
                                      tag.type === "team"
                                          ? "border-green-500 text-green-500"
                                          : tag.type === "custom"
                                              ? "border-purple-500 text-purple-500"
                                              : "border-gray-500 text-gray-500"
                                  } px-2 py-1`}
                              >
                                {tag.name}
                              </Badge>
                          ))}
                    </div>
                    <div
                        className={`px-2 text-sm ${getOpacity(
                            isInstallMode,
                            device.isEligible
                        )}`}
                    >
                      {formatDistanceToNow(new Date(device.last_contact), {
                        addSuffix: true,
                      })}
                    </div>
                    <div
                        className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}
                    >
                      <Badge
                          className={`${
                              device.status === "online"
                                  ? "bg-green-500 text-white"
                                  : device.status === "offline"
                                      ? "bg-gray-500 text-white"
                                      : device.status === "warning" ||
                                      device.status === "app_issue"
                                          ? "bg-yellow-500 text-black"
                                          : "bg-red-500 text-white"
                          } px-2 py-1`}
                      >
                        {device.status === "app_issue" ? "App Issue" : device.status}
                      </Badge>
                    </div>
                    {isInstallMode && (
                        <div
                            className="px-2 flex justify-center items-center isolate"
                            style={{ opacity: 1 }}
                        >
                          {device.isInstalled ? (
                              <div
                                  title="App already installed"
                                  className="flex items-center justify-center w-6 h-6 rounded bg-gray-200 text-green-600 border border-gray-300"
                              >
                                ✓
                              </div>
                          ) : device.isEligible ? (
                              <input
                                  type="checkbox"
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    onDeviceToggle(device.id);
                                  }}
                                  checked={selectedDevices.includes(device.id)}
                                  title="Eligible for installation"
                                  className="w-4 h-4"
                              />
                          ) : (
                              <div
                                  title={device.reason || "Required sensors unavailable"}
                                  className="flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-600 border border-yellow-300"
                              >
                                i
                              </div>
                          )}
                        </div>
                    )}
                  </div>
              );
            })}
          </div>
        </div>

        {/* Reworked Device Details Dialog, uses shadcn/ui Dialog */}
        <Dialog
            open={!!selectedDevice && !selectedApplication}
            onOpenChange={(open) => {
              if (!open) handleCloseModal();
            }}
        >
          <DialogContent className="max-w-[800px] sm:max-w-[900px] overflow-y-auto">

            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Device Details: {selectedDevice?.name}
              </DialogTitle>
              <DialogDescription>
                Learn more about the device’s current status, location, and logs.
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">General Information</h4>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge
                      className={`${
                          selectedDevice?.status === "online"
                              ? "bg-green-500 text-white"
                              : selectedDevice?.status === "offline"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-500 text-white"
                      } px-2 py-1`}
                  >
                    {selectedDevice?.status}
                  </Badge>
                </p>
                <p>
                  <strong>Gemeente:</strong>{" "}
                  {
                    selectedDevice?.tags.find((tag) => tag.type === "location")
                        ?.name
                  }
                </p>
                <p>
                  <strong>Last Contact:</strong>{" "}
                  {selectedDevice?.last_contact &&
                      formatDistanceToNow(new Date(selectedDevice.last_contact), {
                        addSuffix: true,
                      })}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Applications</h4>
                {selectedDevice?.applications.map((app) => (
                    <p
                        key={app.id}
                        className="cursor-pointer text-blue-600 underline"
                        onClick={() => handleApplicationClick(app, selectedDevice)}
                    >
                      {app.name} -{" "}
                      <Badge
                          className={`${
                              app.status === "online"
                                  ? "bg-green-500 text-white"
                                  : app.status === "offline"
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-500 text-white"
                          } px-2 py-1`}
                      >
                        {app.status}
                      </Badge>
                    </p>
                ))}
              </div>
            </div>

            <Separator className="my-4" />
            {renderLogs()}
          </DialogContent>
        </Dialog>

        {/* Reworked Application Details Dialog */}
        <Dialog
            open={!!selectedApplication}
            onOpenChange={(open) => {
              if (!open) handleCloseModal();
            }}
        >
          <DialogContent className="max-w-[900px] overflow-y-auto">

            <DialogHeader>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleBackToDevice}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-2xl font-bold">
                  Application Details: {selectedApplication?.name}
                </DialogTitle>
              </div>
              <DialogDescription>
                Manage and monitor your application status and logs here.
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {selectedApplication?.name}
              </p>
              <p>
                <strong>Description:</strong> {selectedApplication?.description}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <Badge
                    className={`${
                        selectedApplication?.status === "online"
                            ? "bg-green-500 text-white"
                            : selectedApplication?.status === "offline"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                    } px-2 py-1`}
                >
                  {selectedApplication?.status}
                </Badge>
              </p>
              <p>
                <strong>Version:</strong> {selectedApplication?.version}
              </p>

              {selectedApplication?.path && (
                  <p>
                    <strong>Application Link:</strong>{" "}
                    <Button variant="link" onClick={() => setShowAppIframe(true)}>
                      Open Application
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
        ({selectedApplication.path})
      </span>
                  </p>
              )}

              <p>
                <strong>Parent Device:</strong>{" "}
                {selectedApplication?.parentDevice?.name || "Unknown Device"}
              </p>
            </div>

            {showAppIframe && selectedApplication?.path && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Embedded Application</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAppIframe(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div style={{ height: "600px" }}>
                    <iframe
                        src={selectedApplication.path}
                        className="w-full h-full border"
                        title="Application Iframe"
                    />
                  </div>
                </div>
            )}

            <Separator className="my-4" />
            {renderLogs()}
          </DialogContent>
        </Dialog>
      </div>
  );
}
