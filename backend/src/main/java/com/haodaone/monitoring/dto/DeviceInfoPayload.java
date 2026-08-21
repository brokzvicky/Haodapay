package com.haodaone.monitoring.dto;

/**
 * Field-for-field mirror of HaodaOne.Agent.Models.DeviceInfo - sent as the
 * "device" object inside both HeartbeatRequest and ActivityBatchRequest.
 * Property names must stay in sync with the C# record (Jackson maps
 * camelCase JSON to these fields by default, matching System.Text.Json's
 * default camelCase output on the agent side).
 */
public class DeviceInfoPayload {

    private String deviceId;
    private String deviceName;
    private String username;
    private String domainName;
    private String ipAddress;
    private String operatingSystem;
    private String osVersion;
    private String agentVersion;
    private String macAddress;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDomainName() {
        return domainName;
    }

    public void setDomainName(String domainName) {
        this.domainName = domainName;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getOperatingSystem() {
        return operatingSystem;
    }

    public void setOperatingSystem(String operatingSystem) {
        this.operatingSystem = operatingSystem;
    }

    public String getOsVersion() {
        return osVersion;
    }

    public void setOsVersion(String osVersion) {
        this.osVersion = osVersion;
    }

    public String getAgentVersion() {
        return agentVersion;
    }

    public void setAgentVersion(String agentVersion) {
        this.agentVersion = agentVersion;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }
}
