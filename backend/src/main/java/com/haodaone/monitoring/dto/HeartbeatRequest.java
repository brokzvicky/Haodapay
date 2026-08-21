package com.haodaone.monitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/** Mirrors HaodaOne.Agent.Models.HeartbeatModels.HeartbeatRequest field-for-field. */
public class HeartbeatRequest {

    @Valid
    @NotNull
    private DeviceInfoPayload device;

    /** ONLINE | IDLE | LOCKED - free text on purpose so a future agent version can add a status without a backend release. */
    private String status = "ONLINE";

    private String currentUser;

    private OffsetDateTime lastSeenUtc;

    private String currentApplication;

    private String currentWindowTitle;

    private String agentVersion;

    public DeviceInfoPayload getDevice() {
        return device;
    }

    public void setDevice(DeviceInfoPayload device) {
        this.device = device;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(String currentUser) {
        this.currentUser = currentUser;
    }

    public OffsetDateTime getLastSeenUtc() {
        return lastSeenUtc;
    }

    public void setLastSeenUtc(OffsetDateTime lastSeenUtc) {
        this.lastSeenUtc = lastSeenUtc;
    }

    public String getCurrentApplication() {
        return currentApplication;
    }

    public void setCurrentApplication(String currentApplication) {
        this.currentApplication = currentApplication;
    }

    public String getCurrentWindowTitle() {
        return currentWindowTitle;
    }

    public void setCurrentWindowTitle(String currentWindowTitle) {
        this.currentWindowTitle = currentWindowTitle;
    }

    public String getAgentVersion() {
        return agentVersion;
    }

    public void setAgentVersion(String agentVersion) {
        this.agentVersion = agentVersion;
    }
}
