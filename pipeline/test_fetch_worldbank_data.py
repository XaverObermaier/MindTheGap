import copy
import unittest
from unittest.mock import patch

from pipeline import fetch_worldbank_data as pipeline


class ExternalRecognitionTests(unittest.TestCase):
    def test_records_have_explicit_scope_and_provenance(self):
        for code, record in pipeline.EXTERNAL_RECOGNITION.items():
            with self.subTest(code=code):
                self.assertEqual(record["source"], "Norwegian Refugee Council")
                self.assertEqual(record["scope"], "displacement crises")
                self.assertRegex(record["checkedAt"], r"^2026-\d{2}-\d{2}$")
                self.assertIsInstance(record["rank"], int)
                self.assertTrue(record["url"].startswith("https://"))

    def test_unranked_country_is_absent_not_negative(self):
        self.assertNotIn("KEN", pipeline.EXTERNAL_RECOGNITION)

    def test_build_countries_copies_recognition_without_mutation(self):
        original = copy.deepcopy(pipeline.EXTERNAL_RECOGNITION)

        def fake_indicator(_codes, indicator):
            value = 100_000_000 if indicator == pipeline.INDICATORS["population"] else 1
            year = "2025" if indicator == pipeline.INDICATORS["population"] else "2024"
            return {code: {"value": value, "year": year} for code in pipeline.PROFILES}

        with patch.object(pipeline, "fetch_world_bank_indicator", side_effect=fake_indicator):
            countries = pipeline.build_countries()

        by_code = {country["code"]: country for country in countries}
        self.assertEqual(by_code["SDN"]["externalRecognition"], original["SDN"])
        self.assertIsNot(by_code["SDN"]["externalRecognition"], pipeline.EXTERNAL_RECOGNITION["SDN"])
        self.assertNotIn("externalRecognition", by_code["KEN"])
        self.assertEqual(pipeline.EXTERNAL_RECOGNITION, original)


if __name__ == "__main__":
    unittest.main()