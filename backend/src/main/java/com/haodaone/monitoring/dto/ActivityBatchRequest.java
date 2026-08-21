package com.haodaone.monitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

/** Mirrors HaodaOne.Agent.Models.ActivityBatchModels.ActivityBatchRequest. */
public class ActivityBatchRequest {

    @Valid
    @NotNull
    private DeviceInfoPayload device;

    @Valid
    private List<ActivitySessionPayload> sessions = List.of();

    private OffsetDateTime batchSentAtUtc;

    public DeviceInfoPayload getDevice() {
        return device;
    }

    public void setDevice(DeviceInfoPayload device) {
        this.device = device;
    }

    public List<ActivitySessionPayload> getSessions() {
        return sessions;
    }

    public void setSessions(List<ActivitySessionPayload> sessions) {
        this.sessions = sessions;
    }

    public OffsetDateTime getBatchSentAtUtc() {
        return batchSentAtUtc;
    }

    public void setBatchSentAtUtc(OffsetDateTime batchSentAtUtc) {
        this.batchSentAtUtc = batchSentAtUtc;
    }
}
