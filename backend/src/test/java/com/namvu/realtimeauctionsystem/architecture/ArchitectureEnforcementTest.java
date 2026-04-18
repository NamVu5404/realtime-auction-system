package com.namvu.realtimeauctionsystem.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

class ArchitectureEnforcementTest {

    private static JavaClasses importedClasses;

    private static final String[] MODULES = {
            "analytics", "auction", "auth", "bid", "contact", "ekyc", "file", "fraud", "live_chat", "mail",
            "notification", "seller_registration", "user"
    };

    @BeforeAll
    static void setUp() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.namvu.realtimeauctionsystem");
    }

    @Test
    void repositories_should_only_be_accessed_within_their_own_module() {
        for (String module : MODULES) {
            classes()
                .that().resideInAPackage("..modules." + module + ".repository..")
                .should().onlyBeAccessed().byAnyPackage(
                    "..modules." + module + "..", 
                    "..common..", 
                    "..infrastructure..",
                    "com.namvu.realtimeauctionsystem" // Cho phép class Application cấu hình khởi tạo nếu có
                )
                .allowEmptyShould(true)
                .check(importedClasses);
        }
    }

    @Test
    void service_impls_should_not_be_accessed_directly_outside_their_impl_package() {
        for (String module : MODULES) {
            // Không class nào được phép trực tiếp gọi interface implementation (tức là dùng lệnh import ..ServiceImpl)
            // Thay vào đó, tất cả phải dùng interface 
            classes()
                .that().resideInAPackage("..modules." + module + ".service.impl..")
                .should().onlyBeAccessed().byAnyPackage(
                        "..modules." + module + ".service.impl..", 
                        "com.namvu.realtimeauctionsystem", // Cho phép rễ ứng dụng do cấu hình 
                        "..common..",
                        "..infrastructure.."
                )
                .allowEmptyShould(true)
                .check(importedClasses);
        }
    }
}
