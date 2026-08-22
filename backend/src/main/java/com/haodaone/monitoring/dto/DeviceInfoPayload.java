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

    /** Windows hostname - the agent's Environment.MachineName, sent separately from deviceName (an admin-chosen label). */
    private String hostname;

    /** Agent-generated stable per-install GUID (HaodaOne.Agent's MachineGuidProvider), see MonitoredDevice.machineGuid. */
    private String machineGuid;

    /**
     * Employee ID (Employee.employeeCode, e.g. "HAODA-0042") the agent was
     * configured with at install time - lets AgentIngestService resolve the
     * employee directly instead of relying solely on windowsUsername
     * matching User.username, which requires those two values to line up
     * and doesn't hold for every machine/domain setup.
     */
    private String employeeId;

    /** Sent for display/logging only - the backend never trusts this for identity resolution, employeeId (the code) is authoritative. */
    private String employeeName;

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

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getMachineGuid() {
        return machineGuid;
    }

    public void setMachineGuid(String machineGuid) {
        this.machineGuid = machineGuid;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }
}
