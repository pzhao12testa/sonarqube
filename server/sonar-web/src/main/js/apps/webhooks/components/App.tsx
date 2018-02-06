/*
 * SonarQube
 * Copyright (C) 2009-2018 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import { Helmet } from 'react-helmet';
import PageActions from './PageActions';
import PageHeader from './PageHeader';
import WebhooksList from './WebhooksList';
import { createWebhook, deleteWebhook, searchWebhooks, updateWebhook } from '../../../api/webhooks';
import { LightComponent, Organization, Webhook } from '../../../app/types';
import { translate } from '../../../helpers/l10n';

interface Props {
  component?: LightComponent;
  organization: Organization | undefined;
}

interface State {
  loading: boolean;
  webhooks: Webhook[];
}

export default class App extends React.PureComponent<Props, State> {
  mounted: boolean;
  state: State = { loading: true, webhooks: [] };

  componentDidMount() {
    this.mounted = true;
    this.fetchWebhooks();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchWebhooks = () => {
    return searchWebhooks(this.getScopeParams()).then(
      ({ webhooks }) => {
        if (this.mounted) {
          this.setState({ loading: false, webhooks });
        }
      },
      () => {
        if (this.mounted) {
          this.setState({ loading: false });
        }
      }
    );
  };

  getScopeParams = ({ organization, component } = this.props) => {
    return { organization: organization && organization.key, project: component && component.key };
  };

  handleCreate = (data: { name: string; url: string }) => {
    return createWebhook({
      ...data,
      ...this.getScopeParams()
    }).then(({ webhook }) => {
      if (this.mounted) {
        this.setState(({ webhooks }) => ({ webhooks: [...webhooks, webhook] }));
      }
    });
  };

  handleDelete = (key: string) => {
    return deleteWebhook({ key }).then(() => {
      if (this.mounted) {
        this.setState(({ webhooks }) => ({
          webhooks: webhooks.filter(webhook => webhook.key !== key)
        }));
      }
    });
  };

  handleUpdate = (data: { key: string; name: string; url: string }) => {
    return updateWebhook(data).then(() => {
      if (this.mounted) {
        this.setState(({ webhooks }) => ({
          webhooks: webhooks.map(
            webhook => (webhook.key === data.key ? { ...webhook, ...data } : webhook)
          )
        }));
      }
    });
  };

  render() {
    const { loading, webhooks } = this.state;

    return (
      <div className="page page-limited">
        <Helmet title={translate('webhooks.page')} />

        <PageHeader loading={loading}>
          <PageActions
            loading={loading}
            onCreate={this.handleCreate}
            webhooksCount={webhooks.length}
          />
        </PageHeader>

        {!loading && (
          <div className="boxed-group boxed-group-inner">
            <WebhooksList
              onDelete={this.handleDelete}
              onUpdate={this.handleUpdate}
              webhooks={webhooks}
            />
          </div>
        )}
      </div>
    );
  }
}
