import PropTypes from 'prop-types';
import React from 'react';
import FieldSet from 'Components/FieldSet';
import FormGroup from 'Components/Form/FormGroup';
import FormInputGroup from 'Components/Form/FormInputGroup';
import FormLabel from 'Components/Form/FormLabel';
import { inputTypes, sizes } from 'Helpers/Props';
import titleCase from 'Utilities/String/titleCase';

function UpdateSettings(props) {
  const {
    advancedSettings,
    settings,
    isWindows,
    isDocker,
    packageUpdateMechanism,
    onInputChange
  } = props;

  const {
    branch,
    updateAutomatically,
    updateMechanism,
    updateScriptPath
  } = settings;

  if (!advancedSettings) {
    return null;
  }

  const usingExternalUpdateMechanism = packageUpdateMechanism !== 'builtIn';

  const updateOptions = [];

  if (usingExternalUpdateMechanism) {
    updateOptions.push({
      key: packageUpdateMechanism,
      value: titleCase(packageUpdateMechanism)
    });
  } else {
    updateOptions.push({ key: 'builtIn', value: 'Built-In' });
  }

  updateOptions.push({ key: 'script', value: 'Script' });

  if (isDocker) {
    return (
      <FieldSet legend="Updates">
        <div>Updating is disabled inside a docker container.  Update the container image instead.</div>
      </FieldSet>
    );
  }

  return (
    <FieldSet legend="Updates">
      <FormGroup
        advancedSettings={advancedSettings}
        isAdvanced={true}
      >
        <FormLabel>Branch</FormLabel>

        <FormInputGroup
          type={inputTypes.TEXT}
          name="branch"
          helpText={usingExternalUpdateMechanism ? 'Branch used by external update mechanism' : 'Branch to use to update Readarr'}
          helpLink="https://wiki.servarr.com/Readarr_FAQ#How_do_I_update_my_Readarr"
          {...branch}
          onChange={onInputChange}
          readOnly={usingExternalUpdateMechanism}
        />
      </FormGroup>

      {
        !isWindows &&
          <div>
            <FormGroup
              advancedSettings={advancedSettings}
              isAdvanced={true}
              size={sizes.MEDIUM}
            >
              <FormLabel>Automatic</FormLabel>

              <FormInputGroup
                type={inputTypes.CHECK}
                name="updateAutomatically"
                helpText="Automatically download and install updates. You will still be able to install from System: Updates"
                onChange={onInputChange}
                {...updateAutomatically}
              />
            </FormGroup>

            <FormGroup
              advancedSettings={advancedSettings}
              isAdvanced={true}
            >
              <FormLabel>Mechanism</FormLabel>

              <FormInputGroup
                type={inputTypes.SELECT}
                name="updateMechanism"
                values={updateOptions}
                helpText="Use Readarr's built-in updater or a script"
                helpLink="https://wiki.servarr.com/Readarr_FAQ#How_do_I_update_my_Readarr"
                onChange={onInputChange}
                {...updateMechanism}
              />
            </FormGroup>

            {
              updateMechanism.value === 'script' &&
                <FormGroup
                  advancedSettings={advancedSettings}
                  isAdvanced={true}
                >
                  <FormLabel>Script Path</FormLabel>

                  <FormInputGroup
                    type={inputTypes.TEXT}
                    name="updateScriptPath"
                    helpText="Path to a custom script that takes an extracted update package and handle the remainder of the update process"
                    onChange={onInputChange}
                    {...updateScriptPath}
                  />
                </FormGroup>
            }
          </div>
      }
    </FieldSet>
  );
}

UpdateSettings.propTypes = {
  advancedSettings: PropTypes.bool.isRequired,
  settings: PropTypes.object.isRequired,
  isWindows: PropTypes.bool.isRequired,
  isDocker: PropTypes.bool.isRequired,
  packageUpdateMechanism: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired
};

export default UpdateSettings;
