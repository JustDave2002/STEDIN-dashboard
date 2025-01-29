"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDistanceToNow } from 'date-fns';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DeviceTable({ devices, isInstallMode, onDeviceToggle, selectedDevices  }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: 'gemeente',
    direction: 'asc',
  });

  const handleSort = (key) => {
    setSortConfig((prevState) => {
      let direction = 'asc';
      if (prevState.key === key && prevState.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  };

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          const extractNumber = (name) => {
            const match = name.match(/MSR_(\d+)/);
            return match ? parseInt(match[1], 10) : name;
          };
          aValue = extractNumber(a.name);
          bValue = extractNumber(b.name);
          break;
        case 'gemeente':
          const aGemeenteTag = a.tags.find((tag) => tag.type === 'location');
          const bGemeenteTag = b.tags.find((tag) => tag.type === 'location');
          aValue = aGemeenteTag ? aGemeenteTag.name : '';
          bValue = bGemeenteTag ? bGemeenteTag.name : '';
          break;
        case 'last_contact':
          aValue = new Date(a.last_contact);
          bValue = new Date(b.last_contact);
          break;
        case 'tags':
          aValue = a.tags.map((tag) => tag.name).join(', ');
          bValue = b.tags.map((tag) => tag.name).join(', ');
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [devices, sortConfig]);

  const parentRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setHeaderHeight(211);
        }
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

  const handleRowClick = async (device) => {
    setSelectedDevice(device);
    setSelectedApplication(null);
    setLogs([]); // Reset logs before fetching new ones
    await fetchDeviceLogs(device.id);
  };

  const handleApplicationClick = async (application, device) => {
    setSelectedApplication({ ...application, parentDevice: device });
    setLogs([]); // Reset logs before fetching new ones
    await fetchAppInstanceLogs(application.id);
  };

  const fetchDeviceLogs = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/logs?device_id=${deviceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching device logs:', error);
      setLogs([]); // Set to empty array instead of null
    }
  };

  const fetchAppInstanceLogs = async (appInstanceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/logs?app_instance_id=${appInstanceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching application instance logs:', error);
      setLogs([]); // Set to empty array instead of null
    }
  };

  const modalRef = useRef(null);

  const handleCloseModal = () => {
    setSelectedDevice(null);
    setSelectedApplication(null);
    setLogs([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !event.target.closest('.react-datepicker')
      ) {
        handleCloseModal();
      }
    };

    if (selectedDevice || selectedApplication) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDevice, selectedApplication]);

  const renderLogs = () => {
    return (
      <div>
        <h3 className="font-semibold mb-2 mt-4">Logs</h3>
        {logs && logs.length > 0 ? (
          <ul className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
            {logs.map((log) => (
              <li key={log.id} className="text-sm mb-1">
                <span className={`inline-block w-20 font-semibold ${
                  log.warning_level === 'error' ? 'text-red-500' :
                  log.warning_level === 'warning' ? 'text-yellow-500' :
                  log.warning_level === 'offline' ? 'text-grey-500' :
                  'text-green-500'
                }`}>
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
          <p>No logs available</p>
        )}
      </div>
    );
  };

  // Helper function to determine opacity
  const getOpacity = (isInstallMode, isEligible) => {
    return isInstallMode && !isEligible ? 'opacity-25' : '';
  };

  return (
    <div className="flex flex-col">
      {/* Table Header */}
      <div
          ref={headerRef}
          className="table-header border-b"
          style={{
            display: 'grid',
            gridTemplateColumns: isInstallMode
                ? '15% 25% 15% 15% 10% 10% 10%' // With Install column
                : '20% 25% 18% 17% 10% 10%', // Original layout
            fontWeight: 'bold',
            padding: '8px 0',
            flex: '0 0 auto',
          }}
      >
        <div
            onClick={() => handleSort('name')}
            className="cursor-pointer flex items-center justify-start px-2"
        >
          <span>Name</span>
          {sortConfig.key === 'name' &&
              (sortConfig.direction === 'asc' ? (
                  <ArrowUp className="ml-1 h-4 w-4"/>
              ) : (
                  <ArrowDown className="ml-1 h-4 w-4"/>
              ))}
        </div>
        <div className="px-2">Applications</div>
        <div
            onClick={() => handleSort('gemeente')}
            className="cursor-pointer flex items-center justify-start px-2"
        >
          <span>Gemeente</span>
          {sortConfig.key === 'gemeente' &&
              (sortConfig.direction === 'asc' ? (
                  <ArrowUp className="ml-1 h-4 w-4"/>
              ) : (
                  <ArrowDown className="ml-1 h-4 w-4"/>
              ))}
        </div>
        <div
            onClick={() => handleSort('tags')}
            className="cursor-pointer flex items-center justify-start px-2"
        >
          <span>Tags</span>
          {sortConfig.key === 'tags' &&
              (sortConfig.direction === 'asc' ? (
                  <ArrowUp className="ml-1 h-4 w-4"/>
              ) : (
                  <ArrowDown className="ml-1 h-4 w-4"/>
              ))}
        </div>
        <div
            onClick={() => handleSort('last_contact')}
            className="cursor-pointer flex items-center justify-start px-2"
        >
          <span>Last Contact</span>
          {sortConfig.key === 'last_contact' &&
              (sortConfig.direction === 'asc' ? (
                  <ArrowUp className="ml-1 h-4 w-4"/>
              ) : (
                  <ArrowDown className="ml-1 h-4 w-4"/>
              ))}
        </div>
        <div
            onClick={() => handleSort('status')}
            className="cursor-pointer flex items-center justify-start px-2"
        >
          <span>Status</span>
          {sortConfig.key === 'status' &&
              (sortConfig.direction === 'asc' ? (
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
          style={{
            height: `calc(100vh - ${headerHeight}px)`,
            overflowY: 'auto',
          }}
      >
        <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const device = sortedDevices[virtualRow.index];
            return (
                <div
                    key={device.id}
                    className={`table-row border-b cursor-pointer ${
                        !device.isEligible && isInstallMode ? '' : 'hover:bg-gray-100'
                    }`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: '60px',
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                      gridTemplateColumns: isInstallMode
                          ? '15% 25% 15% 15% 10% 10% 10%' // With Install column
                          : '20% 25% 18% 17% 10% 10%', // Original layout
                      alignItems: 'center',
                    }}
                    onClick={!isInstallMode ? () => handleRowClick(device) : null} // Disable onClick in install mode
                >
                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    {device.name}
                  </div>
                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    {device.applications.map((app) => (
                        <Badge
                            key={app.id}
                            onClick={
                              !isInstallMode
                                  ? (e) => {
                                    e.stopPropagation();
                                    handleApplicationClick(app, device);
                                  }
                                  : null // Disable click in install mode
                            }
                            className={`cursor-pointer bg-white border ${
                                app.status === 'online'
                                    ? 'border-green-500 text-green-500'
                                    : app.status === 'offline'
                                        ? 'border-gray-500 text-gray-500'
                                        : app.status === 'warning'
                                            ? 'border-yellow-500 text-yellow-500'
                                            : 'border-red-500 text-red-500'
                            } px-2 py-1 mr-1`}
                        >
                          {app.name}
                        </Badge>
                    ))}
                  </div>

                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    {device.tags
                        .filter((tag) => tag.type === 'location')
                        .map((tag) => (
                            <Badge
                                key={tag.id}
                                className="bg-white border border-blue-500 text-blue-500 px-2 py-1"
                            >
                              {tag.name}
                            </Badge>
                        ))}
                  </div>
                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    {device.tags
                        .filter((tag) => tag.type !== 'location')
                        .map((tag) => (
                            <Badge
                                key={tag.id}
                                className={`bg-white border ${
                                    tag.type === 'team'
                                        ? 'border-green-500 text-green-500'
                                        : tag.type === 'custom'
                                            ? 'border-purple-500 text-purple-500'
                                            : 'border-gray-500 text-gray-500'
                                } px-2 py-1 mr-1`}
                            >
                              {tag.name}
                            </Badge>
                        ))}
                  </div>
                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    {formatDistanceToNow(new Date(device.last_contact), {
                      addSuffix: true,
                    })}
                  </div>
                  <div className={`px-2 ${getOpacity(isInstallMode, device.isEligible)}`}>
                    <Badge
                        className={`${
                            device.status === 'online'
                                ? 'bg-green-500 text-white'
                                : device.status === 'offline'
                                    ? 'bg-gray-500 text-white'
                                    : device.status === 'warning' ||
                                    device.status === 'app_issue'
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-red-500 text-white'
                        } px-2 py-1`}
                    >
                      {device.status === 'app_issue' ? 'App Issue' : device.status}
                    </Badge>
                  </div>
                  {isInstallMode && (
                      <div
                          className="px-2 flex justify-center items-center opacity-100 isolate"
                          style={{isolation: 'isolate', opacity: 1}}
                      >
                        {device.isInstalled ? (
                            // Already installed: Grayed-out filled checkbox with checkmark
                            <div
                                title="App already installed"
                                className="flex items-center justify-center w-6 h-6 rounded bg-gray-200 text-green-600 border border-gray-300 opacity-100 isolate"
                            >
                              ✓
                            </div>
                        ) : device.isEligible ? (
                            // Installable: Regular checkbox
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
                            // Required sensors unavailable: Information icon
                            <div
                                title={device.reason || 'Required sensors unavailable'}
                                className="flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-600 border border-yellow-300 opacity-100 isolate"
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

      {/* Device Details Modal */}
      {selectedDevice && !selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                ref={modalRef}
                className="bg-background p-6 rounded-lg shadow-lg w-3/4 h-3/4 overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Device Details: {selectedDevice.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X className="h-4 w-4"/>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">General Information</h3>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`badge ${
                      selectedDevice.status === 'online'
                        ? 'bg-green-500 text-white'
                        : selectedDevice.status === 'offline'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {selectedDevice.status}
                  </span>
                </p>
                <p>
                  <strong>Gemeente:</strong>{' '}
                  {selectedDevice.tags.find((tag) => tag.type === 'location')?.name}
                </p>
                <p>
                  <strong>Last Contact:</strong>{' '}
                  {formatDistanceToNow(new Date(selectedDevice.last_contact), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Applications</h3>
                {selectedDevice.applications.map((app) => (
                  <p
                    key={app.id}
                    className="cursor-pointer text-blue-500 underline"
                    onClick={() =>
                      handleApplicationClick(app, selectedDevice)
                    }
                  >
                    {app.name} -{' '}
                    <span
                      className={`badge ${
                        app.status === 'online'
                          ? 'bg-green-500 text-white'
                          : app.status === 'offline'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {app.status}
                    </span>
                  </p>
                ))}
              </div>
            </div>
            {renderLogs()}
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-background p-6 rounded-lg shadow-lg w-3/4 h-3/4 overflow-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Application Details: {selectedApplication.name}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <p>
                <strong>Name:</strong> {selectedApplication.name}
              </p>
              <p>
                <strong>Description:</strong> {selectedApplication.description}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`badge ${
                    selectedApplication.status === 'online'
                      ? 'bg-green-500 text-white'
                      : selectedApplication.status === 'offline'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {selectedApplication.status}
                </span>
              </p>
              <p>
                <strong>Version:</strong> {selectedApplication.version}
              </p>
              <p>
                <strong>Path:</strong> {selectedApplication.path}
              </p>
              <p>
                <strong>Parent Device:</strong>{' '}
                {selectedApplication.parentDevice?.name || 'Unknown Device'}
              </p>
            </div>
            {renderLogs()}
          </div>
        </div>
      )}
    </div>
  );
}