package vn.coopfood.kph.architecture;

import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "vn.coopfood.kph", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule TOP_LEVEL_MODULES_ARE_ACYCLIC = slices()
            .matching("vn.coopfood.kph.(*)..")
            .should().beFreeOfCycles();
}
