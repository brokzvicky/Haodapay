package com.haodaone.monitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/** Field-for-field mirror of HaodaOne.Agent.Models.ActivitySession - one entry in ActivityBatchRequest.sessions. */
public class ActivitySessionPayload {

    @NotBlank
    private String sessionId;

    private String deviceId;

    private String username;

    private String processName;

    private String applicationName;

    private String windowTitle;

    @NotNull
    private OffsetDateTime startTimeUtc;

    private OffsetDateTime endTimeUtc;

    private int durationSeconds;

    private boolean isIdleSession;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getProcessName() {
        return processName;
    }

    public void setProcessName(String processName) {
        this.processName = processName;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public void setApplicationName(String applicationName) {
        this.applicationName = applicationName;
    }

    public String getWindowTitle() {
        return windowTitle;
    }

    public void setWindowTitle(String windowTitle) {
        this.windowTitle = windowTitle;
    }

    public OffsetDateTime getStartTimeUtc() {
        return startTimeUtc;
    }

    public void setStartTimeUtc(OffsetDateTime startTimeUtc) {
        this.startTimeUtc = startTimeUtc;
    }

    public OffsetDateTime getEndTimeUtc() {
        return endTimeUtc;
    }

    public void setEndTimeUtc(OffsetDateTime endTimeUtc) {
        this.endTimeUtc = endTimeUtc;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public boolean isIdleSession() {
        return isIdleSession;
    }

    public void setIdleSession(boolean idleSession) {
        isIdleSession = idleSession;
    }
}
