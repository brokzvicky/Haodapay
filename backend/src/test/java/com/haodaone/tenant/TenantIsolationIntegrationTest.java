package com.haodaone.tenant;

import com.haodaone.company.entity.Company;
import com.haodaone.company.repository.CompanyRepository;
import com.haodaone.employee.dto.CreateEmployeeRequest;
import com.haodaone.employee.dto.EmployeeDetailDTO;
import com.haodaone.employee.service.EmployeeService;
import com.haodaone.monitoring.entity.MonitoredDevice;
import com.haodaone.monitoring.repository.MonitoredDeviceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class TenantIsolationIntegrationTest {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private MonitoredDeviceRepository deviceRepository;

    @Autowired
    private EmployeeService employeeService;

    @AfterEach
    public void cleanup() {
        TenantContext.clear();
    }

    @Test
    public void repositoryCompanyScopedFinders_respectCompany() {
        Company a = new Company();
        a.setName("Company A");
        companyRepository.save(a);

        Company b = new Company();
        b.setName("Company B");
        companyRepository.save(b);

        MonitoredDevice d = new MonitoredDevice();
        d.setDeviceId("dev-1");
        d.setDeviceName("Device 1");
        d.setAgentTokenHash("hash-1");
        d.setCompany(a);
        d.setActive(true);
        deviceRepository.save(d);

        List<MonitoredDevice> listA = deviceRepository.findAllByCompany_IdAndDeletedFalseOrderByDeviceNameAsc(a.getId());
        assertEquals(1, listA.size(), "Company A should see its device");

        List<MonitoredDevice> listB = deviceRepository.findAllByCompany_IdAndDeletedFalseOrderByDeviceNameAsc(b.getId());
        assertEquals(0, listB.size(), "Company B should not see Company A's device");
    }

    @Test
    public void employeeCreation_respectsTenantContext() {
        Company a = new Company();
        a.setName("TenantCo");
        companyRepository.save(a);

        // Simulate request context for Tenant A
        TenantContext.setCurrentTenant(a.getId());

        CreateEmployeeRequest req = new CreateEmployeeRequest();
        req.setFirstName("Test");
        req.setLastName("User");
        req.setEmail("test.user+tenant@example.com");
        req.setDateOfJoining(LocalDate.now());

        EmployeeDetailDTO dto = employeeService.create(req);
        assertNotNull(dto);
        assertNotNull(dto.getId());
        assertNotNull(dto.getCompanyId(), "Created employee must have company assigned from TenantContext");
        assertEquals(a.getId(), dto.getCompanyId(), "Employee's company must match the current TenantContext");
    }
}
